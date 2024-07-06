import time
import argparse
import logging
import os
from jetson_utils import videoSource
from frame_processor import FrameProcessor
from motion_detector import MotionDetector
from decision_maker import DecisionMaker
from notifier import Notifier
from fps_tracker import FPSTracker

# Configure the root logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),  # Logs to the console
        # logging.handlers.RotatingFileHandler(
        #     'app.log',            # Log file name
        #     maxBytes=5*1024*1024, # Maximum file size in bytes (e.g., 5 MB)
        #     backupCount=3         # Number of backup files to keep
        # )
    ]
)


def get_output():
    output_dir = "data/output/" + time.strftime("%Y/%m/%d")
    os.makedirs(output_dir, exist_ok=True)
    output_filename = time.strftime("%Y%m%d-%H%M%S.mp4")
    return f"{output_dir}/{output_filename}"


def main():
    parser = argparse.ArgumentParser(description="Smart bird feeder program")
    parser.add_argument('input', type=str,
                        help='Input source, camera/video file')
    args = parser.parse_args()

    frame_processor = FrameProcessor()
    motion_detector = MotionDetector()
    decision_maker = DecisionMaker()
    notifier = Notifier()

    while True:
        time.sleep(5)
        if not motion_detector.detect():
            continue

        # Configure video sources
        output = get_output()
        capture_config = ['--headless', '--input-width=1920', '--input-height=1080',
                          '--input-codec=mjpeg', '--input-rate=30', f'--input-save={output}']
        video_capture = videoSource(args.input, argv=capture_config)

        logging.info('Motion detected. Processing started. Reecording video to "{output}"')

        try:
            while True:
                frame = video_capture.Capture()
                if frame is None:
                    break
                with FPSTracker():
                    has_bird, has_squirrel = frame_processor.run(frame)

                decision_maker.update(has_bird, has_squirrel)
                if decision_maker.decide_bird():
                    notifier.notify_bird()
                if decision_maker.decide_squirrel():
                    notifier.notify_squirrel()
                if decision_maker.decide_stop_recording() or not video_capture.IsStreaming():
                    break
                # give CPU some time to do something else
                time.sleep(0.005)
        finally:
            logging.info('Processing stopped')
            frame_processor.get_results()
            frame_processor.reset()
            decision_maker.reset()
            video_capture.Close()

    frame_processor.close()


if __name__ == "__main__":
    main()
