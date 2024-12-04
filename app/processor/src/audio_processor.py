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
                             px_per_second: int = 75, height_px: int = 300,
                             dpi: int = 100) -> None:
        """Generate spectrogram from audio ndarray data"""
        start_total = time.time()
        duration = len(ndarray) / sr
        width_px = int(duration * px_per_second)

        # STFT computation
        start_stft = time.time()
        n_fft = 1024
        hop_length = n_fft // 4
        D = librosa.stft(ndarray, n_fft=n_fft, hop_length=hop_length)
        stft_time = time.time() - start_stft
        self.logger.info(f"STFT computation time: {stft_time:.2f}s")

        # DB conversion
        start_db = time.time()
        S_db = librosa.amplitude_to_db(np.abs(D), ref=np.max)
        S_db = np.clip(S_db, a_min=-80, a_max=0)
        db_time = time.time() - start_db
        self.logger.info(f"dB conversion time: {db_time:.2f}s")

        # Plot creation and saving
        start_plot = time.time()
        fig = plt.figure(figsize=(width_px/dpi, height_px/dpi))
        ax = plt.Axes(fig, [0., 0., 1., 1.])
        ax.set_axis_off()
        fig.add_axes(ax)

        librosa.display.specshow(
            S_db, sr=sr, ax=ax,
            cmap='viridis',
            x_axis='time',
            y_axis='hz',
            hop_length=hop_length
        )

        plt.savefig(output_path, dpi=dpi, bbox_inches=None,
                    pad_inches=0, pil_kwargs={'quality': 90, 'optimize': True})
        plt.close()
        plot_time = time.time() - start_plot
        self.logger.info(f"Plot generation and save time: {plot_time:.2f}s")

        total_time = time.time() - start_total
        self.logger.info(
            f"Total spectrogram generation time: {total_time:.2f}s")

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
            os.path.dirname(audio_path),
            f"{os.path.splitext(os.path.basename(audio_path))[0]}_spectrogram.jpg"
        )
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
