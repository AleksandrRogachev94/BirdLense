import threading
import time
from datetime import datetime, timezone
import argparse
import logging
import os
import shutil
from frame_processor import FrameProcessor
from detection_strategy import SingleStageStrategy, TwoStageStrategy
from motion_detectors.pir import PIRMotionDetector
from motion_detectors.fake import FakeMotionDetector
from decision_maker import DecisionMaker
from fps_tracker import FPSTracker
from api import API
from sources.media_source import MediaSource
from sources.video_file_source import VideoFileSource
from audio_processor import AudioProcessor
from llm_verifier import LLMVerifier
from app_config.app_config import app_config

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),  # Logs to the console
    ]
)


def get_output_path():
    output_dir = "data/recordings/" + time.strftime("%Y/%m/%d/%H%M%S")
    os.makedirs(output_dir, exist_ok=True)
    return output_dir


def heartbeat():
    api = API()
    id = None
    while True:
        # keep updating activity_log record until restart
        id = api.activity_log(type='heartbeat', data={"status": "up"}, id=id)
        time.sleep(60)


def main():
    heartbeat_thread = threading.Thread(target=heartbeat, daemon=True)
    heartbeat_thread.start()

    parser = argparse.ArgumentParser(description="Smart bird feeder program")
    parser.add_argument('input', type=str, nargs='?',
                        help='Input source, camera/video file')
    parser.add_argument('--fake-motion', type=str, choices=['true', 'false'],
                        help='Use fake motion detector with motion or not')
    args = parser.parse_args()

    # Instantiate all helper classes
    api = API()
    if args.fake_motion:
        motion = args.fake_motion.lower() == 'true'
        motion_detector = FakeMotionDetector(motion=motion, wait=10)
    else:
        motion_detector = PIRMotionDetector()
    decision_maker = DecisionMaker(max_record_seconds=app_config.get(
        'processor.max_record_seconds'), max_inactive_seconds=app_config.get('processor.max_inactive_seconds'))
    main_size = (app_config.get('camera.video_width'),
                 app_config.get('camera.video_height'))
    camera_config = app_config.get('camera')
    media_source = MediaSource(main_size=main_size, camera_config=camera_config) if not args.input else VideoFileSource(
        args.input, main_size=main_size)
    audio_processor = AudioProcessor(lat=app_config.get(
        'secrets.latitude'), lon=app_config.get('secrets.longitude'), spectrogram_px_per_sec=app_config.get('processor.spectrogram_px_per_sec'))
    regional_species = audio_processor.get_regional_species() + ["Squirrel"]
    regional_species = api.set_active_species(regional_species)

    # Initialize LLM verifier if API key is configured
    gemini_api_key = app_config.get('ai.gemini_api_key')
    llm_verifier = None
    if gemini_api_key:
        llm_verifier = LLMVerifier(
            api_key=gemini_api_key,
            model=app_config.get('ai.model'),
            min_confidence=app_config.get('ai.llm_verification.min_confidence'),
            max_calls_per_hour=app_config.get('ai.llm_verification.max_calls_per_hour'),
            max_calls_per_day=app_config.get('ai.llm_verification.max_calls_per_day'),
            latitude=app_config.get('secrets.latitude'),
            longitude=app_config.get('secrets.longitude'),
            log_dir=os.path.join('data', 'llm_verification_logs'),
        )

    # Configure Detection Strategy
    strategy_type = app_config.get('processor.detection_strategy', 'single_stage')
    if strategy_type == 'two_stage':
        detection_strategy = TwoStageStrategy(
            binary_model_path=app_config.get('processor.models.binary'),
            classifier_model_path=app_config.get('processor.models.classifier'),
            regional_species=regional_species
        )
    else:
        detection_strategy = SingleStageStrategy(
            model_path=app_config.get('processor.models.single_stage'),
            regional_species=regional_species
        )

    frame_processor = FrameProcessor(
        detection_strategy=detection_strategy,
        tracker=app_config.get('processor.tracker'), 
        save_images=app_config.get('processor.save_images')
    )
    fps_tracker = FPSTracker()

    # Main motion detection loop
    while True:
        if not motion_detector.detect():
            continue
        api.notify_motion()

        # Configure video sources
        output_path = get_output_path()
        video_output = f"{output_path}/video.mp4"

        media_source.start_recording(video_output)

        logging.info(
            f'Motion detected. Processing started. Recording video and audio to "{video_output}"')
        start_time = datetime.now(timezone.utc)

        # Video processing loop
        try:
            frame_processor.reset()
            decision_maker.reset()
            fps_tracker.reset()
            while True:
                frame = media_source.capture()
                if frame is None:
                    break
                with fps_tracker:
                    has_detections = frame_processor.run(frame)

                # Decision making
                decision_maker.update_has_detections(has_detections)
                species = decision_maker.decide_species(frame_processor.tracks)
                if species is not None:
                    api.notify_species(species)
                if decision_maker.decide_stop_recording():
                    break
            fps_tracker.log_summary()
        finally:
            media_source.stop_recording()
            end_time = datetime.now(timezone.utc)

        try:
            video_detections = decision_maker.get_results(
                frame_processor.tracks)
            audio_detections, spectrogram_path = [], None
            if video_detections:
                audio_detections, spectrogram_path = audio_processor.run(
                    video_output)
                
                # LLM validation (if enabled)
                if llm_verifier:
                    video_detections = llm_verifier.validate_detections(video_detections, start_time)
                    
            # Log summary without best_frame arrays
            video_summary = [{k: v for k, v in d.items() if k != 'best_frame'} for d in video_detections]
            logging.info(
                f'Processing stopped. Video Result: {video_summary}; Audio Result: {audio_detections}')
            if len(video_detections) > 0:
                api.create_video(video_detections, audio_detections, start_time,
                                 end_time, video_output, spectrogram_path)
            else:
                # no detections, delete folder
                shutil.rmtree(output_path)
        except Exception as e:
            logging.error(e)

    media_source.close()


if __name__ == "__main__":
    main()
