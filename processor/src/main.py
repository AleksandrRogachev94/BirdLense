import time
from datetime import datetime, timezone
import argparse
import logging
from logging.handlers import RotatingFileHandler
import os
import shutil
from frame_processor import FrameProcessor
from motion_detector import MotionDetector
from decision_maker import DecisionMaker
from fps_tracker import FPSTracker
from api import API
from sources.audio_source import AudioSource
from sources.camera_source import CameraSource
from sources.video_file_source import VideoFileSource
from audio_processor import AudioProcessor
from app_config.app_config import app_config

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
    parser.add_argument('input', type=str, nargs='?',
                        help='Input source, camera/video file')
    args = parser.parse_args()

    # Instantiate all helper classes
    motion_detector = MotionDetector()
    decision_maker = DecisionMaker(max_record_seconds=app_config.get(
        'processor.max_record_seconds'), max_inactive_seconds=app_config.get('processor.max_inactive_seconds'))
    main_size = (app_config.get('processor.video_width'),
                 app_config.get('processor.video_height'))
    video_source = CameraSource(main_size=main_size) if not args.input else VideoFileSource(
        args.input, main_size=main_size)
    audio_source = AudioSource()
    audio_processor = AudioProcessor(lat=app_config.get(
        'secrets.latitude'), lon=app_config.get('secrets.longitude'))
    regional_species = audio_processor.get_regional_species()
    frame_processor = FrameProcessor(
        regional_species=regional_species, tracker=app_config.get('processor.tracker'), save_images=app_config.get('processor.save_images'))
    api = API()
    api.set_active_species(regional_species)

    # Main motion detection loop
    while True:
        if not motion_detector.detect():
            continue

        # Configure video sources
        output_path = get_output_path()
        video_output = f"{output_path}/video.mp4"
        audio_output = f"{output_path}/audio.mp4"

        video_source.start_recording(video_output)
        audio_source.start_recording(audio_output)

        logging.info(
            f'Motion detected. Processing started. Recording video to "{video_output}" and audio to "{audio_output}"')
        start_time = datetime.now(timezone.utc)

        # Video processing loop
        try:
            frame_processor.reset()
            decision_maker.reset()
            while True:
                frame = video_source.capture()
                if frame is None:
                    break
                with FPSTracker():
                    has_detections = frame_processor.run(frame)

                decision_maker.update_has_detections(has_detections)

                species = decision_maker.decide_species(frame_processor.tracks)
                if species is not None:
                    api.notify_species(species)

                if decision_maker.decide_stop_recording():
                    break
                # give CPU some time to do something else
                time.sleep(0.005)
        finally:
            video_source.stop_recording()
            audio_source.stop_recording()
            end_time = datetime.now(timezone.utc)

        try:
            audio_detections = audio_processor.run(audio_output)
        except Exception as e:
            logging.error(e)
            audio_detections = []

        try:
            video_detections = decision_maker.get_results(
                frame_processor.tracks)
            detections = video_detections + audio_detections
            logging.info(
                f'Processing stopped. Result: {detections}')
            if len(detections) > 0:
                api.create_video(detections, start_time,
                                 end_time, video_output, audio_output)
            else:
                # no detections, delete folder and do nothing
                shutil.rmtree(output_path)
        except Exception as e:
            logging.error(e)

    frame_processor.close()
    video_source.close()


if __name__ == "__main__":
    main()
