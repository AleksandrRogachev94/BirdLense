import logging
import requests
import os


class API():
    def __init__(self):
        self.logger = logging.getLogger(__name__)

    def notify_species(self, species):
        self.logger.info('Notifying about "{species}" presence')
        requests.post(
            f"{os.environ['API_URL_BASE']}/notify", json={'detection': species})

    def create_video(self, species, start_time, end_time, video_path, audio_path):
        requests.post(f"{os.environ['API_URL_BASE']}/videos", json={
            'video_processor_version': '1',
            'species': [{**sp, 'source': 'video'} for sp in species],
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
            'video_path': video_path,
            'audio_path': audio_path,
        })
