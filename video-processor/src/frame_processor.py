import time
import logging
import numpy as np
from ultralytics import YOLO


class FrameProcessor:
    def __init__(self, regional_species=None, save_images=False):
        self.save_images = save_images
        self.logger = logging.getLogger(__name__)
        self.reset()
        self.logger.info('Loading model...')
        self.model = YOLO(
            "models/detection/nabirds_yolov8n_ncnn_model", task="detect")
        self.model.predict(np.zeros((640, 640, 3)))  # warm up with test frame
        self.logger.info('Done loading model.')
        if regional_species:
            # Filter used classes using substrings since .
            self.classes = [id for id, label in self.model.names.items() if any(
                reg_species in label for reg_species in regional_species)]
            self.logger.info(f'Regional species: {regional_species}')
            self.logger.info(
                f'Filtered video classes: {[self.model.names[cls] for cls in self.classes]}')

    def run(self, img):
        if img is None:
            raise Exception('Frame is missing')
        self.cnt += 1

        # Detect
        st = time.time()
        results = self.model.track(
            img, persist=True, conf=0.01, classes=self.classes)
        if self.save_images:
            results[0].save(f'data/test/frame{str(self.cnt)}.jpg')
        if results[0].boxes.id is None:
            self.logger.debug('No detections')
            return False

        track_ids = results[0].boxes.id.int().cpu().tolist()
        class_indexes = results[0].boxes.cls.int().cpu().tolist()
        names = results[0].names
        class_names = [names[class_index] for class_index in class_indexes]
        tracks = list(zip(track_ids, class_names))
        self.logger.debug(f'Tracks: {tracks}')
        for track_id, class_name in tracks:
            self.update_track(track_id, class_name)

        self.logger.debug(
            f'Detection Time: {(time.time() - st) * 1000} [msec]')

        return True

    def update_track(self, track_id, class_name):
        if track_id not in self.tracks:
            self.tracks[track_id] = {
                'start_time': round(time.time() - self.start_time),
                'preds': []
            }
        self.tracks[track_id]['preds'].append(class_name)
        # keep updating end_time with each new frame
        self.tracks[track_id]['end_time'] = round(
            time.time() - self.start_time)

    def reset(self):
        self.tracks = {}
        self.start_time = time.time()
        self.cnt = 0
