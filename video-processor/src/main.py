import time
from datetime import datetime, timezone
import argparse
import logging
import os
import requests
from jetson_utils import videoSource
from frame_processor import FrameProcessor
from motion_detector import MotionDetector
from decision_maker import DecisionMaker
from fps_tracker import FPSTracker
from api import API

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
    api = API()

    while True:
        time.sleep(5)
        if not motion_detector.detect():
            continue

        # Configure video sources
        output = get_output()
        capture_config = ['--headless', '--input-width=1920', '--input-height=1080',
                          '--input-codec=mjpeg', '--input-rate=30', f'--input-save={output}']
        video_capture = videoSource(args.input, argv=capture_config)

        logging.info(
            'Motion detected. Processing started. Reecording video to "{output}"')
        start_time = datetime.now(timezone.utc)

        try:
            while True:
                frame = video_capture.Capture()
                if frame is None:
                    break
                with FPSTracker():
                    has_bird, has_squirrel = frame_processor.run(frame)

                decision_maker.update(has_bird, has_squirrel)
                if decision_maker.decide_bird():
                    api.notify_bird()
                if decision_maker.decide_squirrel():
                    api.notify_squirrel()
                if decision_maker.decide_stop_recording() or not video_capture.IsStreaming():
                    break
                # give CPU some time to do something else
                time.sleep(0.005)
        finally:
            species_names = frame_processor.get_results()
            logging.info(
                f'Processing stopped. Species: {", ".join(species_names)}')
            end_time = datetime.now(timezone.utc)
            api.upload_video(species_names, start_time,
                             end_time, output, output)
            frame_processor.get_results()
            frame_processor.reset()
            decision_maker.reset()
            video_capture.Close()

    frame_processor.close()


if __name__ == "__main__":
    main()
