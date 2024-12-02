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

    def merge_detections(self, detections):
        """
        Merge adjacent detections of the same species.

        Args:
            detections (list): List of detection dictionaries

        Returns:
            list: Merged detections
        """
        if not detections:
            return []

        # Sort detections by start time
        sorted_detections = sorted(detections, key=lambda x: x['start_time'])

        merged = []
        current = sorted_detections[0]

        for next_det in sorted_detections[1:]:
            # Check if detections are for the same species and effectively adjacent
            if (current['species_name'] == next_det['species_name'] and
                    next_det['start_time'] - current['end_time'] <= 1.0):  # Within 1 second
                # Merge by extending the end time and keeping the higher confidence
                current['end_time'] = max(
                    current['end_time'], next_det['end_time'])
                current['confidence'] = max(
                    current['confidence'], next_det['confidence'])
                # keep the first spectrogram
            else:
                # Add the current detection to merged list and update current
                merged.append(current)
                current = next_det

        # Add the last detection
        merged.append(current)

        return merged

    def run(self, audio_path):
        self.logger.info(f'Processing audio "{audio_path}"...')
        st = time.time()
        recording = Recording(
            self.analyzer,
            audio_path,
            lat=self.lat,
            lon=self.lon,
            date=datetime.now(),
            min_conf=0.5,
        )
        recording.analyze()
        recording.extract_detections_as_spectrogram(
            directory=os.path.dirname(audio_path)
        )
        self.logger.info(
            f'Audio Processing Time: {(time.time() - st) * 1000} [msec]')

        # Convert detections and merge adjacent ones
        raw_detections = [{
            'species_name': det['common_name'],
            'start_time': det['start_time'],
            'end_time': det['end_time'],
            'confidence': det['confidence'],
            'spectrogram_path': det['extracted_spectrogram_path'],
            'source': 'audio'
        } for det in recording.detections]

        return self.merge_detections(raw_detections)
