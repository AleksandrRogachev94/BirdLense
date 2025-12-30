import time
from collections import Counter


class DecisionMaker():
    def __init__(self,  max_record_seconds=60, max_inactive_seconds=10, min_track_duration=2):
        self.max_record_seconds = max_record_seconds
        self.max_inactive_seconds = max_inactive_seconds
        self.min_track_duration = min_track_duration
        self.reset()

    def reset(self):
        self.stop_recording_decided = False
        self.species_decided = False
        self.start_time = time.time()
        self.inactive_start_time = None

    def update_has_detections(self, has_detections):
        if not has_detections:
            if self.inactive_start_time is None:
                self.inactive_start_time = time.time()
        else:
            self.inactive_start_time = None

    def decide_stop_recording(self):
        if self.stop_recording_decided:
            # already decided once
            return False
        reached_max_record_seconds = (
            time.time() - self.start_time) >= self.max_record_seconds
        reached_max_inactive_seconds = self.inactive_start_time and (
            time.time() - self.inactive_start_time) >= self.max_inactive_seconds
        decision = reached_max_inactive_seconds or reached_max_record_seconds
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
        for track_id, track in tracks.items():
            # Skip tracks with no predictions yet
            if not track['preds']:
                continue
            # Find most common prediction for each track
            pred_counts = Counter(track['preds'])
            species_name, count = pred_counts.most_common(1)[0]
            confidence = count / len(track['preds'])
            # Only consider species with at least min_track_duration
            if track['end_time'] - track['start_time'] >= self.min_track_duration:
                result.append({
                    'track_id': track_id,
                    'species_name': species_name,
                    'start_time': track['start_time'],
                    'end_time': track['end_time'],
                    'confidence': confidence,
                    'best_frame': track.get('best_frame'),
                    'source': 'video'
                })

        return result
