import time
from datetime import datetime, timezone
import argparse
import logging
from logging.handlers import RotatingFileHandler
import os
import shutil
from jetson_utils import videoSource
from frame_processor import FrameProcessor
from motion_detector import MotionDetector
from decision_maker import DecisionMaker
from fps_tracker import FPSTracker
from api import API
from audio_source import AudioSource

# Configure the root logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),  # Logs to the console
        RotatingFileHandler(
            'app.log',            # Log file name
            maxBytes=5*1024*1024,  # Maximum file size in bytes (e.g., 5 MB)
            backupCount=1         # Number of backup files to keep
        )
    ]
)


def get_output_path():
    output_dir = "data/recordings/" + time.strftime("%Y/%m/%d/%H%M%S")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir


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
        time.sleep(60)
        if not motion_detector.detect():
            continue

        # Configure video sources
        output_path = get_output_path()
        video_output = f"{output_path}/video.mp4"
        audio_output = f"{output_path}/audio.mp4"
        # TODO best settings
        capture_config = ['--headless', '--input-width=1920', '--input-height=1080',
                          '--input-codec=mjpeg', '--input-rate=30', f'--input-save={video_output}']
        video_capture = videoSource(args.input, argv=capture_config)
        audio_source = AudioSource(audio_output)
        audio_source.start_recording()

        logging.info(
            f'Motion detected. Processing started. Reecording video to "{video_output}" and audio to "{audio_output}"')
        start_time = datetime.now(timezone.utc)

        try:
            frame_processor.reset()
            decision_maker.reset()
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
            video_capture.Close()
            audio_source.stop_recording()

        try:
            end_time = datetime.now(timezone.utc)
            species = frame_processor.get_results()
            logging.info(
                f'Processing stopped. Result: {species}')
            if len(species) > 0:
                api.create_video(species, start_time,
                                 end_time, video_output, audio_output)
            else:
                shutil.rmtree(output_path)
        except Exception as e:
            logging.error(e)

    frame_processor.close()


if __name__ == "__main__":
    main()
