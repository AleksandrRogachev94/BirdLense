from abc import ABC, abstractmethod
import logging
from typing import List, Optional, Tuple
from dataclasses import dataclass
import numpy as np
from ultralytics import YOLO
import cv2

logger = logging.getLogger(__name__)

@dataclass
class DetectionResult:
    """
    Represents a single detection.
    
    Attributes:
        track_id: Unique integer ID for the tracked object.
        class_name: The detected class name (species).
        confidence: Confidence score of the detection (0.0 to 1.0).
        bbox: Normalized bounding box coordinates [x1, y1, x2, y2].
        blur_variance: Laplacian variance of the crop (higher = sharper).
        crop: BGR image crop of the detected object.
    """
    track_id: int
    class_name: str
    confidence: float
    bbox: List[float]
    blur_variance: Optional[float] = None
    crop: Optional[np.ndarray] = None

class DetectionStrategy(ABC):
    def __init__(self, min_center_dist: float = 0.1, min_box_size_px: int = 50, blur_threshold: float = 100.0, max_blur_checks: int = 3):
        self.min_center_dist = min_center_dist
        self.min_box_size_px = min_box_size_px
        self.blur_threshold = blur_threshold
        self.max_blur_checks = max_blur_checks

    def is_blurry(self, image: np.ndarray) -> Tuple[bool, float]:
        """
        Check if the image is blurry using the variance of the Laplacian.
        
        Args:
            image: BGR image crop
            
        Returns:
            Tuple of (is_blurry: bool, variance: float).
            Higher variance means sharper image.
        """
        if image is None or image.size == 0:
            return True, 0.0
        
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        is_blur = variance < self.blur_threshold
        if is_blur:
            logger.info(f"Blur detected: variance={variance:.1f} < threshold={self.blur_threshold}")
        return is_blur, variance

    @abstractmethod
    def detect(self, frame: np.ndarray, tracker_config: str, min_confidence: float) -> List[DetectionResult]:
        pass
    
    @abstractmethod
    def reset(self):
        pass


    def is_valid_detection(self, bbox: List[float], conf: float, min_confidence: float) -> bool:
        """
        Check if detection center is not too close to edges and confidence is sufficient.
        
        Args:
            bbox: Normalized bounding box [x1, y1, x2, y2]
            conf: Detection confidence
            min_confidence: Minimum required confidence
        """
        x1, y1, x2, y2 = bbox

        # Calculate center point
        center_x = (x1 + x2) / 2
        center_y = (y1 + y2) / 2

        # Check if center is too close to any edge
        if (center_x < self.min_center_dist or  # Too close to left
            center_x > (1 - self.min_center_dist) or  # Too close to right
            center_y < self.min_center_dist or  # Too close to top
                center_y > (1 - self.min_center_dist)):  # Too close to bottom
            return False

        # Skip if confidence is too low
        if conf < min_confidence:
            return False

        return True

class SingleStageStrategy(DetectionStrategy):
    def __init__(self, model_path: str, regional_species: Optional[List[str]] = None, min_center_dist: float = 0.1):
        super().__init__(min_center_dist)
        self.logger = logging.getLogger(self.__class__.__name__)
        self.model = YOLO(model_path, task="detect")
        self.regional_species = regional_species
        self.classes = None
        
        if self.regional_species:
             self.logger.info(f'Initializing with regional species filters: {self.regional_species}')
             self.classes = [id for id, label in self.model.names.items() if any(
                reg_species in label for reg_species in self.regional_species)]
             
             # Log the actual class names that are enabled
             enabled_classes = [self.model.names[id] for id in self.classes]
             self.logger.info(f'Regional species filters active: {len(self.classes)} classes enabled.')
             self.logger.info(f'Enabled classes: {enabled_classes}')

        # Warmup
        self.model.track(np.zeros((640, 640, 3)), tracker="bytetrack.yaml", persist=True, verbose=False)

    def detect(self, frame: np.ndarray, tracker_config: str, min_confidence: float) -> List[DetectionResult]:
        results = self.model.track(
            frame, persist=True, conf=min_confidence,
            classes=self.classes, tracker=tracker_config, verbose=False)
        
        if not results or results[0].boxes.id is None:
            return []

        boxes = results[0].boxes
        track_ids = boxes.id.int().cpu().tolist()
        class_indexes = boxes.cls.int().cpu().tolist()
        confidences = boxes.conf.cpu().tolist()
        xyxyn = boxes.xyxyn.cpu().numpy()
        xyxy = boxes.xyxy.cpu().numpy()

        h, w, _ = frame.shape

        detection_results = []
        for track_id, class_idx, conf, bbox_norm, bbox_abs in zip(track_ids, class_indexes, confidences, xyxyn, xyxy):
            if not self.is_valid_detection(bbox_norm, conf, min_confidence):
                continue
            
            # Check min size
            x1n, y1n, x2n, y2n = bbox_norm
            if (x2n - x1n) * w < self.min_box_size_px or (y2n - y1n) * h < self.min_box_size_px:
                continue
            
            # Extract crop and compute blur
            x1, y1, x2, y2 = map(int, bbox_abs)
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)
            
            if x2 <= x1 or y2 <= y1:
                continue
                
            crop = frame[y1:y2, x1:x2].copy()
            is_blur, blur_variance = self.is_blurry(crop)
            
            # Skip blurry detections (same as TwoStageStrategy)
            if is_blur:
                continue

            detection_results.append(DetectionResult(
                track_id=track_id, 
                class_name=self.model.names[class_idx], 
                confidence=conf, 
                bbox=bbox_norm,
                blur_variance=blur_variance,
                crop=crop
            ))
            
        return detection_results

    def reset(self):
        if hasattr(self.model.predictor, 'trackers'):
             self.model.predictor.trackers[0].reset()


class TwoStageStrategy(DetectionStrategy):
    def __init__(self, binary_model_path: str, classifier_model_path: str, regional_species: Optional[List[str]] = None, min_center_dist: float = 0.1, min_box_size_px: int = 50, blur_threshold: float = 100.0):
        super().__init__(min_center_dist, min_box_size_px, blur_threshold)
        self.logger = logging.getLogger(self.__class__.__name__)
        self.regional_species = regional_species
        
        self.binary_model = YOLO(binary_model_path, task="detect")
        self.classifier_model = YOLO(classifier_model_path, task="classify")
        
        # Round-robin index for classification scheduling
        self._classification_index = 0
        
        # Pre-calculate allowed class IDs for regional species
        self.classes = None
        if self.regional_species:
            self.logger.info(f'Initializing with regional species filters: {self.regional_species}')
            self.classes = [
                id for id, label in self.classifier_model.names.items() 
                if any(reg_species in self._normalize_class_name(label) for reg_species in self.regional_species)
            ]
            # Log the actual class names that are enabled
            enabled_classes = [self._normalize_class_name(self.classifier_model.names[id]) for id in self.classes]
            self.logger.info(f'Regional species filters active: {len(self.classes)} classes enabled.')
            self.logger.info(f'Enabled classes: {enabled_classes}')

        # Warmup
        self.binary_model.track(np.zeros((320, 320, 3), dtype=np.uint8), tracker="bytetrack.yaml", persist=True, verbose=False)
        self.classifier_model(np.zeros((224, 224, 3), dtype=np.uint8), verbose=False)

    def _normalize_class_name(self, name: str) -> str:
        """
        Normalize a classifier model class name to standard display format.
        
        Converts model-specific formatting (underscores, _OR_) to 
        human-readable format (spaces, /).
        
        Args:
            name: Raw class name from the model (e.g., "Blue_Jay", "Winter_OR_juvenile")
            
        Returns:
            Normalized name (e.g., "Blue Jay", "Winter/juvenile")
        """
        return name.replace('_OR_', '/').replace('_', ' ')

    def _classify_crop(self, crop: np.ndarray) -> Tuple[Optional[str], float]:
        """
        Run classification on a crop, manually filtering for regional species if configured since ultralytics classifier ignores 'classes' arg.
        Returns: (species_name, confidence)
        """
        result_cls = self.classifier_model(crop, verbose=False)
        
        if not result_cls or not result_cls[0].probs:
            return None, 0.0
            
        probs = result_cls[0].probs
        
        if self.classes:
            # Filter for best regional species
            all_probs = probs.data
            valid_probs = {cid: all_probs[cid].item() for cid in self.classes if cid < len(all_probs)}
            
            if valid_probs:
                best_id, best_conf = max(valid_probs.items(), key=lambda x: x[1])
                return self._normalize_class_name(result_cls[0].names[best_id]), best_conf
            return "Unknown", 0.0
            
        top1_idx = probs.top1
        return self._normalize_class_name(result_cls[0].names[top1_idx]), probs.top1conf.item()

    def detect(self, frame: np.ndarray, tracker_config: str, min_confidence: float) -> List[DetectionResult]:
        """
        Two-stage detection: binary detection followed by species classification.
        
        Flow:
        1. Binary Detection: Detect "bird" vs "not bird" using fast model.
        2. Validity Filter (cheap): Drop detections that are too close to edges,
           too small, or low confidence. These are likely noise or partial birds.
        3. Round-Robin Classification (one per frame): To limit compute, we classify
           only ONE bird per frame, rotating through valid detections.
        4. Blur Check (before classification): Skip classification if the selected
           crop is blurry (motion blur, out of focus). Try up to 3 candidates.
        5. Build Results: Return all valid detections. Only the classified one
           has a species name; others have class_name=None (tracked but not yet classified).
        """
        # 1. Binary Detection
        results = self.binary_model.track(
            frame, persist=True, conf=min_confidence, verbose=False, imgsz=320, tracker=tracker_config)
            
        if not results or results[0].boxes.id is None:
            return []

        boxes = results[0].boxes
        track_ids = boxes.id.int().cpu().tolist()
        confidences = boxes.conf.cpu().tolist()
        xyxyn = boxes.xyxyn.cpu().numpy() # normalized for output
        xyxy = boxes.xyxy.cpu().numpy()   # absolute for cropping

        h, w, _ = frame.shape

        # 2. Collect all valid boxes first
        valid_boxes = []
        for track_id, conf, bbox_norm, bbox_abs in zip(track_ids, confidences, xyxyn, xyxy):
            # Check validity BEFORE classification to save compute
            if not self.is_valid_detection(bbox_norm, conf, min_confidence):
                continue

            x1, y1, x2, y2 = map(int, bbox_abs)
            # Clamp
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)
             
            if x2 <= x1 or y2 <= y1:
                continue
            
            # Check minimum size
            box_w = x2 - x1
            box_h = y2 - y1
            if box_w < self.min_box_size_px or box_h < self.min_box_size_px:
                continue
            
            valid_boxes.append({
                'track_id': track_id,
                'conf': conf,
                'bbox_norm': bbox_norm,
                'crop_coords': (x1, y1, x2, y2)
            })
        
        if not valid_boxes:
            return []
        
        # Sort by track_id for consistent ordering
        valid_boxes.sort(key=lambda b: b['track_id'])
        
        # 3. Round-robin selection - find first non-blurry box to classify
        start_idx = self._classification_index % len(valid_boxes)
        self._classification_index += 1
        
        classified = None  # {track_id, crop, blur_variance}
        for i in range(min(len(valid_boxes), self.max_blur_checks)):
            idx = (start_idx + i) % len(valid_boxes)
            box = valid_boxes[idx]
            x1, y1, x2, y2 = box['crop_coords']
            crop = frame[y1:y2, x1:x2]
            is_blur, variance = self.is_blurry(crop)
            if not is_blur:
                classified = {
                    'track_id': box['track_id'],
                    'crop': crop.copy(),
                    'blur_variance': variance
                }
                break
        
        # 4. Build results - only classified box has species_name and crop
        detection_results = []
        for box in valid_boxes:
            species_name = None
            crop = None
            blur_variance = None
            
            if classified and box['track_id'] == classified['track_id']:
                species_name, conf = self._classify_crop(classified['crop'])
                box['conf'] = conf

                crop = classified['crop']
                blur_variance = classified['blur_variance']
            
            detection_results.append(DetectionResult(
                track_id=box['track_id'],
                class_name=species_name,
                confidence=box['conf'], 
                bbox=box['bbox_norm'],
                blur_variance=blur_variance,
                crop=crop
            ))
             
        return detection_results

    def reset(self):
        self._classification_index = 0
        if hasattr(self.binary_model.predictor, 'trackers'):
            self.binary_model.predictor.trackers[0].reset()
