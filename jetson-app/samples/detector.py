import os
from jetson_inference import detectNet
import jetson_utils

script_dir = os.path.dirname(os.path.abspath(__file__))
detector_file = os.path.join(
    script_dir, 'models', 'detection', 'ssd-mobilenet.onnx')
labels = os.path.join(script_dir, 'models', 'detection', 'labels.txt')
detector = detectNet(detector_file, threshold=0.5, labels=labels, input_blob="input_0",
                     output_bbox="boxes", output_cvg="scores", argv=[f'--log-level=info'])
detector.SetTrackingEnabled(True)

video_capture = jetson_utils.videoSource(
    "./data/videos/video4.mp4", argv=['--headless'])
video_output = jetson_utils.videoOutput("./data/output/test_detector.mp4")

while True:
    img = video_capture.Capture()

    if img is None:  # capture timeout
        continue

    detections = detector.Detect(img)

    video_output.Render(img)
    if not video_capture.IsStreaming() or not video_output.IsStreaming():
        break
