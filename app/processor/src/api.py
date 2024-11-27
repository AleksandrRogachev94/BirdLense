import logging
import requests
import os


class API():
    def __init__(self):
        self.logger = logging.getLogger(__name__)

        # Ensure the API URL base is available
        self.api_url_base = os.environ.get('API_URL_BASE')
        if not self.api_url_base:
            raise EnvironmentError(
                "API_URL_BASE environment variable is not set.")

    def _send_request(self, method, endpoint, json_data):
        """ Helper function to send HTTP requests and handle errors """
        url = f"{self.api_url_base}/{endpoint}"
        try:
            # Directly use requests methods based on method argument
            response = requests.request(method, url, json=json_data)

            # Raise an error if the response status code is not 200 or 201
            response.raise_for_status()

            return response
        except requests.exceptions.RequestException as e:
            self.logger.error(f"API request failed for {url}: {e}")
            raise  # Re-raise the exception after logging it

    def notify_species(self, species):
        # No need for try/except here since _send_request handles errors
        self._send_request('POST', 'notify', {'detection': species})

    def create_video(self, species_video, species_audio, start_time, end_time, video_path, audio_path):
        video_data = {
            'processor_version': '1',
            'species': [{**sp, 'source': 'video'} for sp in species_video] + [{**sp, 'source': 'audio'} for sp in species_audio],
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
            'video_path': video_path,
            'audio_path': audio_path,
        }
        response = self._send_request('POST', 'videos', video_data)
        return response.json()  # Assuming the response contains useful data

    def set_active_species(self, active_names):
        self._send_request('PUT', 'species/active', active_names)

    def activity_log(self, type, data, id=None):
        log_data = {'type': type, 'data': data, 'id': id}
        response = self._send_request('POST', 'activity_log', log_data)
        response_data = response.json()
        # Capture the returned 'id' from the response
        return response_data.get('id')
