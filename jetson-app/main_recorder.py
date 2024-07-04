import os
import time
# from jetson_inference import detectNet, imageNet
from jetson_utils import videoSource, videoOutput, cudaAllocMapped, cudaCrop, saveImage
from recorder import Recorder
from frame_processor import FrameProcessor
from execution_timer import ExecutionTimer

script_dir = os.path.dirname(os.path.abspath(__file__))

# Load detector
# detector_file = os.path.join(script_dir, 'models', 'detection', 'ssd-mobilenet.onnx')
# labels = os.path.join(script_dir, 'models', 'detection', 'labels.txt')
# detector = detectNet(detector_file, threshold=0.5, labels=labels, input_blob="input_0", output_bbox="boxes", output_cvg="scores")
# detector.SetTrackingEnabled(True)
# net.SetTrackingParams(minFrames=3, dropFrames=15, overlapThreshold=0.5)

# Load classifier.
# classifier_file = os.path.join(script_dir, 'models', 'classification', 'resnet18.onnx')
# labels = os.path.join(script_dir, 'models', 'classification', 'labels.txt')
# classifier = imageNet(classifier_file, labels=labels, input_blob="input_0", output_blob="output_0")


frame_processor = FrameProcessor()
# Configure video sources
capture = os.path.join(script_dir, 'videos', 'video3.mp4')
output = os.path.join(script_dir, 'videos', 'sample1_out.mp4')
recorder = Recorder()
recorder.start(capture, output)

try:
    i = 0
    while True:
            i+= 1
            frame = recorder.read()
            if frame is None:
                break
            frame_processor.run(frame)
            print(f'-- Main iteration {i}')
            time.sleep(0.005)
finally:
    print('--- Main stop')
    print('!!!!!!')
    frame_processor.get_results()
    recorder.stop()

    