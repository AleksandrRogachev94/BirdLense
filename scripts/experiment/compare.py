import cv2
import os
from collections import defaultdict, Counter
from ultralytics import YOLO
from tqdm import tqdm

# 1. Load Models
# base_model = YOLO("yolo11n.pt") 
base_model = YOLO("../../app/processor/models/detection/nabirds_yolo11n_binary/weights/best_ncnn_model", task="detect") 
custom_cls_model = YOLO("../../app/processor/models/classification/nabirds_yolo11n_cls/weights/best_ncnn_model", task="classify")
custom_det_model = YOLO("../../app/processor/models/detection/nabirds_yolov8n_ncnn_model", task="detect") 

# 2. Configuration
# input_path = "./bird_videos/05-31-170950-video.mp4"
input_path = "/Users/alex/Downloads/manybirds.mp4"
output_folder = "./processed_comparisons"
os.makedirs(output_folder, exist_ok=True)

# OPTIONAL: Use custom detector for Stage 1 of Approach A?
# If True, it ignores 'classes=[14]' and treats everything detected as a 'bird' candidate
USE_CUSTOM_TRACKER_FOR_A = False 

# Params
VIDEO_FPS = 30        # Assumed video FPS (will be overridden by actual FPS)
PROCESSING_FPS = 5    # Simulated processing FPS (like Raspberry Pi)
IMGSZ_TRACK = 320
IMGSZ_DET = 640
CONF = 0.2

# CRITICAL: Resize to match lores stream used in live detection.
# The camera uses a 640x480 lores stream for detection, while recording
# the full 1280x720 main stream. Without this resize, detection results differ.
LORES_SIZE = (640, 480)

# Visual Settings
FONT_SCALE = 1.0      # Increased from 0.6
FONT_THICKNESS = 2
TEXT_COLOR = (255, 255, 255) # White text
BOX_COLOR = (0, 255, 0)      # Green box

# Track Histories: {track_id: [class_label1, class_label2, ...]}
history_a = defaultdict(list)
history_b = defaultdict(list)

# Setup Video
filename = os.path.basename(input_path)
output_path = os.path.join(output_folder, f"cmp_{filename}")
cap = cv2.VideoCapture(input_path)
w, h = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
out = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*'mp4v'), cap.get(cv2.CAP_PROP_FPS), (w * 2, h))

pbar = tqdm(total=int(cap.get(cv2.CAP_PROP_FRAME_COUNT)), desc="Processing")
frame_idx = 0

# Calculate how often to process frames to simulate PROCESSING_FPS
actual_fps = cap.get(cv2.CAP_PROP_FPS)
PROCESS_INTERVAL = max(1, int(actual_fps / PROCESSING_FPS))  # e.g., 30/5 = 6
print(f"Video FPS: {actual_fps}, Processing FPS: {PROCESSING_FPS}, Process every {PROCESS_INTERVAL} frames")

# Track last boxes for non-processed frames (store coordinates, not full frames)
last_boxes_a = []  # List of (x1, y1, x2, y2, text_label)
last_res_b = None  # Store last result for approach B

def draw_boxes_a(img, boxes_list):
    """Draw stored boxes on current frame for approach A"""
    for x1, y1, x2, y2, text_label in boxes_list:
        (text_w, text_h), baseline = cv2.getTextSize(text_label, cv2.FONT_HERSHEY_SIMPLEX, FONT_SCALE, FONT_THICKNESS)
        cv2.rectangle(img, (x1, y1), (x2, y2), BOX_COLOR, 2)
        cv2.rectangle(img, (x1, y1), (x1 + text_w, y1 + text_h + 10), BOX_COLOR, -1)
        cv2.putText(img, text_label, (x1, y1 + text_h + 5), cv2.FONT_HERSHEY_SIMPLEX, FONT_SCALE, TEXT_COLOR, FONT_THICKNESS)

while cap.isOpened():
    success, frame = cap.read()
    if not success: break
    
    view_a, view_b = frame.copy(), frame.copy()
    
    # Resize to lores size to match live camera detection behavior
    frame_lores = cv2.resize(frame, LORES_SIZE)
    lores_h, lores_w = frame_lores.shape[:2]
    scale_x, scale_y = w / lores_w, h / lores_h

    # Only process every PROCESS_INTERVAL frames to simulate slower hardware
    if frame_idx % PROCESS_INTERVAL == 0:
        # --- Approach A: Two-Stage ---
        last_boxes_a = []  # Reset for this processed frame
        
        # Binary Choice for tracking (use lores frame for detection)
        if USE_CUSTOM_TRACKER_FOR_A:
            res_a = custom_det_model.track(frame_lores, persist=True, imgsz=IMGSZ_TRACK, conf=CONF, verbose=False, tracker='bytetrack.yaml', task="detect")
        else:
            # classes=[14]
            res_a = base_model.track(frame_lores, persist=True, imgsz=IMGSZ_TRACK, conf=CONF, verbose=False, tracker='bytetrack.yaml', task="detect")

        if res_a[0].boxes.id is not None:
            boxes = res_a[0].boxes.xyxy.cpu().numpy()
            tids = res_a[0].boxes.id.int().cpu().numpy()
            confs = res_a[0].boxes.conf.cpu().numpy()  # Binary detector confidence
            crops, meta = [], []
            
            for box, tid, det_conf in zip(boxes, tids, confs):
                # Coordinates are in lores space - scale to original for visualization
                lx1, ly1, lx2, ly2 = map(int, box)
                x1, y1, x2, y2 = int(lx1 * scale_x), int(ly1 * scale_y), int(lx2 * scale_x), int(ly2 * scale_y)
                pw, ph = int((x2-x1)*0.1), int((y2-y1)*0.1)
                px1, py1, px2, py2 = max(0,x1-pw), max(0,y1-ph), min(w,x2+pw), min(h,y2+ph)
                crop = view_a[py1:py2, px1:px2]
                if crop.size > 0:

                    crops.append(crop)
                    meta.append((x1, y1, x2, y2, tid, det_conf))
            
            if crops:
                # Process crops one at a time to avoid NCNN batch inference issues
                for i, crop in enumerate(crops):
                    cls_res = custom_cls_model(crop, verbose=False, task="classify")
                    r = cls_res[0]
                    label = r.names[r.probs.top1]
                    cls_conf = r.probs.top1conf.item()
                    x1, y1, x2, y2, tid, det_conf = meta[i]
                    history_a[tid].append(label)
                    
                    # Store box info for reuse on non-processed frames
                    # Format: "ID:1 det:0.35 American Crow 0.72"
                    text_label = f"ID:{tid} det:{det_conf:.2f} {label} {cls_conf:.2f}"
                    last_boxes_a.append((x1, y1, x2, y2, text_label))
        
        # Draw boxes on current frame
        draw_boxes_a(view_a, last_boxes_a)

        # --- Approach B: Single-Stage (also use lores frame for fair comparison) ---
        res_b = custom_det_model.track(frame_lores, persist=True, imgsz=IMGSZ_DET, conf=CONF, verbose=False, tracker='bytetrack.yaml', task="detect")
        if res_b[0].boxes.id is not None:
            for box, tid, cls_idx in zip(res_b[0].boxes.xyxy, res_b[0].boxes.id, res_b[0].boxes.cls):
                label = custom_det_model.names[int(cls_idx)]
                history_b[int(tid)].append(label)
        last_res_b = res_b[0]  # Store for reuse
        # Scale boxes back to original resolution for plotting
        view_b_lores = cv2.resize(view_b, LORES_SIZE)
        view_b_lores = res_b[0].plot(img=view_b_lores)
        view_b = cv2.resize(view_b_lores, (w, h))
    else:
        # Non-processed frame: draw last known boxes on CURRENT frame (smooth video)
        draw_boxes_a(view_a, last_boxes_a)
        if last_res_b is not None:
            view_b_lores = cv2.resize(view_b, LORES_SIZE)
            view_b_lores = last_res_b.plot(img=view_b_lores)
            view_b = cv2.resize(view_b_lores, (w, h))

    # Layout
    cv2.putText(view_a, f"Two-Stage (CustomTrack:{USE_CUSTOM_TRACKER_FOR_A})", (20, 40), 0, 0.8, (255, 255, 255), 2)
    cv2.putText(view_b, "Single-Stage (Custom Det)", (20, 40), 0, 0.8, (255, 255, 255), 2)
    out.write(cv2.hconcat([view_a, view_b]))
    pbar.update(1); frame_idx += 1

cap.release(); out.release(); pbar.close()

# --- FINAL SUMMARY ---
def print_summary(name, history):
    print(f"\n--- {name} TRACK SUMMARY ---")
    print(f"{'TrackID':<10} | {'Dominant Class':<25} | {'Dominant/Total Frames'}")
    print("-" * 65)
    for tid, labels in sorted(history.items()):
        counts = Counter(labels)
        dominant, freq = counts.most_common(1)[0]
        print(f"{tid:<10} | {dominant:<25} | {freq}/{len(labels)}")

print_summary("TWO-STAGE", history_a)
print_summary("SINGLE-STAGE", history_b)