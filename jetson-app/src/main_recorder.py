import time
from recorder import Recorder
from frame_processor import FrameProcessor


frame_processor = FrameProcessor()
# Configure video sources
capture = 'data/videos/video3.mp4'
output = 'data/videos/sample1_out.mp4'
recorder = Recorder()
recorder.start(capture, output)

try:
    i = 0
    while True:
        i += 1
        frame = recorder.read()
        if frame is None:
            break
        frame_processor.run(frame)
        print(f'-- Main iteration {i}')
        time.sleep(0.005)
finally:
    print('--- Main stop')
    frame_processor.get_results()
    recorder.stop()
