import time
import logging
import cv2
import numpy as np
from light_level_detector import LightLevelDetector
from detection_strategy import DetectionStrategy

class FrameProcessor:
    def __init__(self, detection_strategy: DetectionStrategy, save_images=False, tracker='bytetrack.yaml'):
        self.save_images = save_images
        self.tracker = tracker
        self.logger = logging.getLogger(__name__)
        self.light_detector = LightLevelDetector()
        
        self.strategy = detection_strategy
        
        self.logger.info('FrameProcessor initialized.')
        self.reset()

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
        
        # Strategy detect - Returns ONLY valid result objects
        results = self.strategy.detect(img, self.tracker, min_confidence=0.1) # min_confidence could be config, leaving 0.1 default
        
        if self.save_images and results:
            debug_img = img.copy()
            h, w, _ = debug_img.shape
            for res in results:
                x1, y1, x2, y2 = res.bbox
                # Denormalize
                x1, y1, x2, y2 = int(x1*w), int(y1*h), int(x2*w), int(y2*h)
                cv2.rectangle(debug_img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(debug_img, f"{res.class_name} {res.confidence:.2f}", (x1, y1 - 10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            cv2.imwrite(f'data/test/frame{str(self.cnt)}.jpg', debug_img)

        if not results:
            self.logger.debug('No detections')
            return False

        print(results)

        # Update tracks with valid detections
        for res in results:
            self.update_track(res.track_id, res.class_name, res.crop, res.blur_variance)

        self.logger.debug(
            f'Detection Time: {(time.time() - st) * 1000:.0f} msec | '
            f'Valid: {len(results)}'
        )

        return len(results) > 0

    def update_track(self, track_id, class_name, crop=None, blur_variance=None):
        if track_id not in self.tracks:
            self.tracks[track_id] = {
                'start_time': round(time.time() - self.start_time, 1),
                'preds': [],
                'best_frame': None,
                'best_frame_score': 0.0
            }
        # Only append real predictions (None means not classified this frame)
        if class_name is not None:
            self.tracks[track_id]['preds'].append(class_name)
        self.tracks[track_id]['end_time'] = round(
            time.time() - self.start_time, 1)
        
        # Update best frame if this crop is sharper
        if crop is not None and blur_variance is not None:
            if blur_variance > self.tracks[track_id]['best_frame_score']:
                self.tracks[track_id]['best_frame'] = crop
                self.tracks[track_id]['best_frame_score'] = blur_variance

    def reset(self):
        self.tracks = {}
        if self.strategy:
            self.strategy.reset()
        self.start_time = time.time()
        self.cnt = 0
