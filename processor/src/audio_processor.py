import time
import logging
import os
from datetime import datetime
from birdnetlib import Recording
from birdnetlib.analyzer import Analyzer
from birdnetlib.species import SpeciesList


class AudioProcessor:
    def __init__(self, lat, lon):
        self.lat = lat
        self.lon = lon
        self.logger = logging.getLogger(__name__)
        self.analyzer = Analyzer()
        self.species_list = SpeciesList()

    def get_regional_species(self):
        species = self.species_list.return_list(
            lat=self.lat, lon=self.lon, date=datetime.now(), threshold=0.03)
        return [s['common_name'] for s in species]

    def run(self, audio_path):
        self.logger.info(f'Processing audio "{audio_path}"...')
        st = time.time()
        recording = Recording(
            self.analyzer,
            audio_path,
            lat=self.lat,
            lon=self.lon,
            date=datetime.now(),
            min_conf=0.25,
        )
        recording.analyze()
        recording.extract_detections_as_spectrogram(
            directory=os.path.dirname(audio_path)
        )
        self.logger.info(
            f'Audio Processing Time: {(time.time() - st) * 1000} [msec]')
        return [{
            'species_name': det['common_name'],
            'start_time': det['start_time'],
            'end_time': det['end_time'],
            'confidence': det['confidence'],
            'spectrogram_path': det['extracted_spectrogram_path'],
            'source': 'audio'
        } for det in recording.detections]
