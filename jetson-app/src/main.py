import time
import argparse
import logging
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

        logging.info('Motion detected. Processing started')

        # Configure video sources
        output = 'data/output/out.mp4'
        capture_config = ['--headless', '--input-width=1920', '--input-height=1080',
                          '--input-codec=mjpeg', '--input-rate=30', f'--input-save={output}']
        video_capture = videoSource(args.input, argv=capture_config)

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
