import time
import logging
import os
import numpy as np
import matplotlib.pyplot as plt
import librosa
import librosa.display
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
        self.sample_rate = 48000

    def generate_spectrogram(self, ndarray: np.ndarray, sr: int, output_path: str,
                             px_per_second: int = 100, height_px: int = 256,
                             dpi: int = 100) -> None:
        """Generate mel spectrogram from audio ndarray in 500-12000Hz range"""
        start_total = time.time()
        duration = len(ndarray) / sr
        width_px = int(duration * px_per_second)

        n_fft = 2048
        hop_length = int(sr / px_per_second)

        mel_spec = librosa.feature.melspectrogram(
            y=ndarray,
            sr=sr,
            n_fft=n_fft,
            hop_length=hop_length,
            n_mels=128,
            fmin=200,
            fmax=12000,
            power=2.0
        )
        S_db = librosa.power_to_db(mel_spec, ref=np.max)

        fig = plt.figure(figsize=(width_px/dpi, height_px/dpi))
        ax = plt.Axes(fig, [0., 0., 1., 1.])
        ax.set_axis_off()
        fig.add_axes(ax)

        librosa.display.specshow(
            S_db, sr=sr, ax=ax,
            cmap='magma',
            x_axis='time',
            y_axis='mel',
            hop_length=hop_length,
            vmin=-60,
            vmax=0
        )

        plt.savefig(output_path, dpi=dpi, bbox_inches=None,
                    pad_inches=0, pil_kwargs={'quality': 85, 'optimize': True})
        plt.close()

        self.logger.info(
            f"Total spectrogram generation time: {time.time() - start_total:.2f}s")

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

        # Generate spectrogram
        spectrogram_path = os.path.join(
            os.path.dirname(audio_path), "spectrogram.jpg")
        self.generate_spectrogram(
            recording.ndarray, self.sample_rate, spectrogram_path)

        self.logger.info(
            f'Total Audio Processing Time: {(time.time() - st) * 1000:.0f} msec')

        # Convert detections and merge adjacent ones
        raw_detections = [{
            'species_name': det['common_name'],
            'start_time': det['start_time'],
            'end_time': det['end_time'],
            'confidence': det['confidence'],
            'source': 'audio'
        } for det in recording.detections]

        merged_detections = self.merge_detections(raw_detections)

        return merged_detections, spectrogram_path
