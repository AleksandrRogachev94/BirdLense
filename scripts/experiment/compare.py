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
SKIP_FRAMES = 0
IMGSZ_TRACK = 320
IMGSZ_DET = 640
CONF = 0.2

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

while cap.isOpened():
    success, frame = cap.read()
    if not success: break
    
    view_a, view_b = frame.copy(), frame.copy()

    if frame_idx % (SKIP_FRAMES + 1) == 0:
        # --- Approach A: Two-Stage ---
        # Binary Choice for tracking
        if USE_CUSTOM_TRACKER_FOR_A:
            res_a = custom_det_model.track(view_a, persist=True, imgsz=IMGSZ_TRACK, conf=CONF, verbose=False, tracker='bytetrack.yaml', task="detect")
        else:
            # classes=[14]
            res_a = base_model.track(view_a, persist=True, imgsz=IMGSZ_TRACK, conf=CONF, verbose=False, tracker='bytetrack.yaml', task="detect")

        if res_a[0].boxes.id is not None:
            boxes = res_a[0].boxes.xyxy.cpu().numpy()
            tids = res_a[0].boxes.id.int().cpu().numpy()
            crops, meta = [], []
            
            for box, tid in zip(boxes, tids):
                x1, y1, x2, y2 = map(int, box)
                pw, ph = int((x2-x1)*0.1), int((y2-y1)*0.1)
                px1, py1, px2, py2 = max(0,x1-pw), max(0,y1-ph), min(w,x2+pw), min(h,y2+ph)
                crop = view_a[py1:py2, px1:px2]
                if crop.size > 0:
                    crops.append(crop)
                    meta.append((x1, y1, x2, y2, tid))
            
            if crops:
                # Process crops one at a time to avoid NCNN batch inference issues
                for i, crop in enumerate(crops):
                    cls_res = custom_cls_model(crop, verbose=False, task="classify")
                    r = cls_res[0]
                    label = r.names[r.probs.top1]
                    x1, y1, x2, y2, tid = meta[i]
                    history_a[tid].append(label)
                    
                    # --- UPDATED DRAWING LOGIC ---
                    text_label = f"ID:{tid} {label}"
                    
                    # Calculate text size to position it nicely inside
                    (text_w, text_h), baseline = cv2.getTextSize(text_label, cv2.FONT_HERSHEY_SIMPLEX, FONT_SCALE, FONT_THICKNESS)
                    
                    # Draw Bounding Box
                    cv2.rectangle(view_a, (x1, y1), (x2, y2), BOX_COLOR, 2)
                    
                    # Draw Filled Rectangle (Background for text) inside top-left
                    # We ensure y1 + text_h doesn't go below y2 (simple check, though usually bird boxes are big enough)
                    cv2.rectangle(view_a, (x1, y1), (x1 + text_w, y1 + text_h + 10), BOX_COLOR, -1)
                    
                    # Draw Text inside the filled rectangle
                    cv2.putText(view_a, text_label, (x1, y1 + text_h + 5), cv2.FONT_HERSHEY_SIMPLEX, FONT_SCALE, TEXT_COLOR, FONT_THICKNESS)

        # --- Approach B: Single-Stage ---
        res_b = custom_det_model.track(view_b, persist=True, imgsz=IMGSZ_DET, conf=CONF, verbose=False, tracker='bytetrack.yaml', task="detect")
        if res_b[0].boxes.id is not None:
            for box, tid, cls_idx in zip(res_b[0].boxes.xyxy, res_b[0].boxes.id, res_b[0].boxes.cls):
                label = custom_det_model.names[int(cls_idx)]
                history_b[int(tid)].append(label)
        view_b = res_b[0].plot()

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