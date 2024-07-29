import time
from collections import Counter

ROUGH_FPS = 1  # Approximate FPS of frame processing. Adjust based on hardware
MIN_TRACK_SECONDS = 3  # Minimum number seconds for a track to be included in the results
MIN_TRACK_FRAMES = ROUGH_FPS * MIN_TRACK_SECONDS
STOP_RECORDING_SECONDS = 30  # Number of seconds required to decide to stop recording
STOP_RECORDING_FRAMES = ROUGH_FPS * STOP_RECORDING_SECONDS


class DecisionMaker():
    def __init__(self):
        self.reset()

    def reset(self, max_seconds=60):
        self.no_detect_count = 0
        self.stop_recording_decided = False
        self.species_decided = False
        self.max_seconds = max_seconds
        self.start_time = time.time()

    def update_has_detections(self, has_detections):
        if not has_detections:
            self.no_detect_count += 1
        else:
            self.no_detect_count = 0

    def decide_stop_recording(self):
        if self.stop_recording_decided:
            # already decided once
            return False
        reached_max_seconds = (
            time.time() - self.start_time) >= self.max_seconds
        decision = self.no_detect_count >= STOP_RECORDING_FRAMES or reached_max_seconds
        self.stop_recording_decided = decision
        return decision

    def decide_species(self, tracks):
        if self.species_decided:
            # already decided once
            return None
        results = self.get_results(tracks)
        if len(results) > 0:
            self.species_decided = True
            return results[0]['species_name']
        return None

    def get_results(self, tracks):
        result = []
        for track in tracks.values():
            # Reduce false positives
            if len(track['preds']) < MIN_TRACK_FRAMES:
                continue

            # Find most common prediction for each track
            pred_counts = Counter(track['preds'])
            species_name, count = pred_counts.most_common(1)[0]
            confidence = count / len(track['preds'])

            result.append({
                'species_name': species_name,
                'start_time': track['start_time'],
                'end_time': track['end_time'],
                'confidence': confidence,
                'source': 'video'
            })

        return result
