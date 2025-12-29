from abc import ABC, abstractmethod
import logging
import os
from typing import List, Tuple, Optional
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
        bbox: Normalized bounding box coordinates [x1, y1, x2, y2], where x and y are relative to image dimensions (0.0 to 1.0).
    """
    track_id: int
    class_name: str
    confidence: float
    bbox: List[float]

class DetectionStrategy(ABC):
    def __init__(self, min_center_dist: float = 0.2):
        self.min_center_dist = min_center_dist

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
    def __init__(self, model_path: str, regional_species: Optional[List[str]] = None, min_center_dist: float = 0.2):
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
        self.model.track(np.zeros((640, 640, 3)), tracker="bytetrack.yaml", verbose=False)

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

        detection_results = []
        for track_id, class_idx, conf, bbox in zip(track_ids, class_indexes, confidences, xyxyn):
            # Internal filtering primarily done by YOLO conf/classes, but check validity (center dist) here
            if self.is_valid_detection(bbox, conf, min_confidence):
                detection_results.append(DetectionResult(
                    track_id=track_id, 
                    class_name=self.model.names[class_idx], 
                    confidence=conf, 
                    bbox=bbox
                ))
            
        return detection_results

    def reset(self):
        if hasattr(self.model.predictor, 'trackers'):
             self.model.predictor.trackers[0].reset()


class TwoStageStrategy(DetectionStrategy):
    def __init__(self, binary_model_path: str, classifier_model_path: str, regional_species: Optional[List[str]] = None, min_center_dist: float = 0.2):
        super().__init__(min_center_dist)
        self.logger = logging.getLogger(self.__class__.__name__)
        self.regional_species = regional_species
        
        self.binary_model = YOLO(binary_model_path, task="detect")
        self.classifier_model = YOLO(classifier_model_path, task="classify")
        
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
        self.binary_model.track(np.zeros((320, 320, 3), dtype=np.uint8), tracker="bytetrack.yaml", verbose=False)
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

    def detect(self, frame: np.ndarray, tracker_config: str, min_confidence: float) -> List[DetectionResult]:
        # 1. Binary Detection
        results = self.binary_model.track(
            frame, persist=True, conf=min_confidence, verbose=True, imgsz=320, tracker=tracker_config)
            
        if not results or results[0].boxes.id is None:
            return []

        boxes = results[0].boxes
        track_ids = boxes.id.int().cpu().tolist()
        confidences = boxes.conf.cpu().tolist()
        xyxyn = boxes.xyxyn.cpu().numpy() # normalized for output
        xyxy = boxes.xyxy.cpu().numpy()   # absolute for cropping

        detection_results = []
        h, w, _ = frame.shape

        for i, (track_id, conf, bbox_norm, bbox_abs) in enumerate(zip(track_ids, confidences, xyxyn, xyxy)):
             
             # Check validity BEFORE classification to save compute
             if not self.is_valid_detection(bbox_norm, conf, min_confidence):
                 continue

             x1, y1, x2, y2 = map(int, bbox_abs)
             # Clamp
             x1, y1 = max(0, x1), max(0, y1)
             x2, y2 = min(w, x2), min(h, y2)
             
             if x2 <= x1 or y2 <= y1:
                 continue
                 
             crop = frame[y1:y2, x1:x2]
             
             # Classification with regional filtering
             result_cls = self.classifier_model(crop, classes=self.classes, verbose=True)
             
             # Get top 1 class
             top1_idx = result_cls[0].probs.top1
             species_name = self._normalize_class_name(result_cls[0].names[top1_idx])
             
             detection_results.append(DetectionResult(
                 track_id=track_id,
                 class_name=species_name,
                 confidence=conf, 
                 bbox=bbox_norm
             ))
             
        return detection_results

    def reset(self):
         if hasattr(self.binary_model.predictor, 'trackers'):
             self.binary_model.predictor.trackers[0].reset()
