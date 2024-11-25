import logging
import requests
import os


class API():
    def __init__(self):
        self.logger = logging.getLogger(__name__)

    def notify_species(self, species):
        self.logger.info(f'Notifying about "{species}" presence')
        requests.post(
            f"{os.environ['API_URL_BASE']}/notify", json={'detection': species})

    def create_video(self, species, start_time, end_time, video_path, audio_path):
        self.logger.info(f'Creating video record')
        requests.post(f"{os.environ['API_URL_BASE']}/videos", json={
            'processor_version': '1',
            'species': [{**sp, 'source': 'video'} for sp in species],
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
            'video_path': video_path,
            'audio_path': audio_path,
        })

    def set_active_species(self, active_names):
        self.logger.info(f'Setting active species')
        requests.put(
            f"{os.environ['API_URL_BASE']}/species/active", json=active_names)

    def activity_log(self, type, data, id=None):
        response = requests.post(
            f"{os.environ['API_URL_BASE']}/activity_log",
            json={'type': type, 'data': data, 'id': id}
        )

        # Check if the request was successful (status code 200 or 201)
        if response.status_code in [200, 201]:
            response_data = response.json()
            # Capture the returned 'id' from the response
            return response_data.get('id')
        else:
            logging.error(f"Failed to log activity: {response.status_code}")
            return None
