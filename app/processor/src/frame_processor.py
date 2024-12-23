import time
import logging
import numpy as np
from ultralytics import YOLO
from light_level_detector import LightLevelDetector


class FrameProcessor:
    def __init__(self, regional_species=None, save_images=False, min_confidence=0.1, min_center_dist=0.2, tracker='bytetrack.yaml'):
        self.save_images = save_images
        self.tracker = tracker
        self.min_confidence = min_confidence
        self.min_center_dist = min_center_dist
        self.logger = logging.getLogger(__name__)
        self.light_detector = LightLevelDetector()
        self.logger.info('Loading model...')
        self.model = YOLO(
            "models/detection/nabirds_yolov8n_ncnn_model", task="detect")
        # warm up with test frame
        self.model.track(np.zeros((640, 640, 3)), tracker=self.tracker)
        self.logger.info('Done loading model.')
        self.reset()

        if regional_species:
            # Filter used classes using substrings since .
            self.classes = [id for id, label in self.model.names.items() if any(
                reg_species in label for reg_species in regional_species)]
            self.logger.info(f'Regional species: {regional_species}')
            self.logger.info(
                f'Filtered video classes: {[self.model.names[cls] for cls in self.classes]}')

    def is_valid_detection(self, bbox, conf):
        """Check if detection center is not too close to edges and confidence is sufficient"""
        x1, y1, x2, y2 = bbox

        # Calculate center point
        center_x = (x1 + x2) / 2
        center_y = (y1 + y2) / 2

        # Check if center is too close to any edge
        if (center_x < self.min_center_dist or  # Too close to left
            center_x > (1 - self.min_center_dist) or  # Too close to right
            center_y < self.min_center_dist or  # Too close to top
                center_y > (1 - self.min_center_dist)):  # Too close to bottom
            self.logger.info(
                f'Skipping detection with center at ({center_x:.2f}, {center_y:.2f})')
            return False

        # Skip if confidence is too low
        if conf < self.min_confidence:
            return False

        return True

    def run(self, img):
        # incoming frame is BGR
        if img is None:
            raise Exception('Frame is missing')
        self.cnt += 1

        # Check lighting condition first
        if not self.light_detector.has_sufficient_light(img):
            time.sleep(1)  # rate limiting when light is low
            return False

        # Detect
        st = time.time()
        results = self.model.track(
            img, persist=True, conf=self.min_confidence,
            classes=self.classes, tracker=self.tracker, verbose=False)
        if self.save_images:
            results[0].save(f'data/test/frame{str(self.cnt)}.jpg')
        if results[0].boxes.id is None:
            self.logger.debug('No detections')
            return False

        boxes = results[0].boxes
        track_ids = boxes.id.int().cpu().tolist()
        class_indexes = boxes.cls.int().cpu().tolist()
        confidences = boxes.conf.cpu().tolist()
        xyxyn = boxes.xyxyn.cpu().numpy()  # normalized coordinates

        # Filter valid detections
        valid_detections = []
        for track_id, class_idx, conf, bbox in zip(track_ids, class_indexes, confidences, xyxyn):
            if self.is_valid_detection(bbox, conf):
                valid_detections.append(
                    (track_id, self.model.names[class_idx]))

        # Update tracks with valid detections
        for track_id, class_name in valid_detections:
            self.update_track(track_id, class_name)

        self.logger.debug(
            f'Detection Time: {(time.time() - st) * 1000:.0f} msec | '
            f'Valid: {len(valid_detections)}/{len(track_ids)}'
        )

        return len(valid_detections) > 0

    def update_track(self, track_id, class_name):
        if track_id not in self.tracks:
            self.tracks[track_id] = {
                'start_time': round(time.time() - self.start_time, 1),
                'preds': []
            }
        self.tracks[track_id]['preds'].append(class_name)
        self.tracks[track_id]['end_time'] = round(
            time.time() - self.start_time, 1)

    def reset(self):
        self.tracks = {}
        self.model.predictor.trackers[0].reset()
        self.start_time = time.time()
        self.cnt = 0
