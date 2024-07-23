import time
import logging
from logging.handlers import RotatingFileHandler
import os
from datetime import datetime
import requests
from birdnetlib import Recording
from birdnetlib.analyzer import Analyzer
from birdnetlib.species import SpeciesList

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

lat = os.environ['LATITUDE']
lon = os.environ['LONGITUDE']
API_BASE_URL = os.environ['API_URL_BASE']


# All expected species in the region
logger.info("Regional species:")
logging.info(SpeciesList().return_list(lat=lat, lon=lon))

analyzer = Analyzer()


def process_video(video, lat, lon):
    try:
        logging.info(f"Processing record {video}")
        recording = Recording(
            analyzer,
            video['audio_path'],
            lat=lat,
            lon=lon,
            date=datetime.now(),
            min_conf=0.25,
        )
        recording.analyze()
        recording.extract_detections_as_spectrogram(
            directory=os.path.dirname(video['audio_path'])
        )
        logging.info(f'Detections: {recording.detections}')
        post_processed_audio(video['id'], recording.detections)
    except Exception as e:
        logging.error(f"Error processing video {video['id']}: {e}")


def post_processed_audio(video_id, detections):
    try:
        species_data = [{
            'species_name': det['common_name'],
            'start_time': det['start_time'],
            'end_time': det['end_time'],
            'confidence': det['confidence'],
            'spectrogram_path': det['extracted_spectrogram_path'],
            'source': 'audio'
        } for det in detections]
        response = requests.post(
            f"{API_BASE_URL}/videos/{video_id}/audio_processed", json={'species': species_data})
        response.raise_for_status()
    except requests.RequestException as e:
        logging.error(
            f"Error posting processed audio for video {video_id}: {e}")


def main():
    while True:
        try:
            response = requests.get(f"{API_BASE_URL}/videos/audio_pending")
            response.raise_for_status()
            videos = response.json()
            for video in videos:
                process_video(video, lat, lon)
        except requests.RequestException as e:
            logging.error(f"Error fetching pending videos: {e}")
        time.sleep(10)


if __name__ == "__main__":
    main()
