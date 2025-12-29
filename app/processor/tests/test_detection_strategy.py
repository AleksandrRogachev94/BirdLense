import unittest
import sys
import os
import cv2
import numpy as np
import logging

# Ensure project root is in path to import app modules
current_dir = os.path.dirname(os.path.abspath(__file__))
# app/processor/tests -> app/processor/src
src_path = os.path.abspath(os.path.join(current_dir, '../src'))
sys.path.append(src_path)

try:
    from detection_strategy import TwoStageStrategy, SingleStageStrategy
except ImportError:
    pass

# Sample regional species list in Philadelphia area.
regional_species = ['Northern Cardinal', 'Dark-eyed Junco', 'Tufted Titmouse', 'American Crow', 'Mourning Dove', 'Blue Jay', 'Carolina Wren', 'White-breasted Nuthatch', 'White-throated Sparrow', 'Downy Woodpecker', 'Red-bellied Woodpecker', 'Song Sparrow', 'European Starling', 'American Goldfinch', 'House Finch', 'Carolina Chickadee', 'House Sparrow', 'American Robin', 'Northern Mockingbird', 'Black-capped Chickadee', 'Eastern Bluebird', 'Northern Flicker', 'Hairy Woodpecker', 'Rock Pigeon', 'Golden-crowned Kinglet', 'Yellow-rumped Warbler', 'Pileated Woodpecker', 'American Tree Sparrow', 'Red-winged Blackbird', 'Red-breasted Nuthatch', 'Brown Creeper', 'Common Raven', 'Cedar Waxwing', 'Yellow-bellied Sapsucker', 'Common Grackle', 'Purple Finch', 'Pine Siskin', 'Horned Lark', 'Hermit Thrush', 'Swamp Sparrow', 'Ruby-crowned Kinglet', 'Eastern Towhee', 'Winter Wren', 'Fox Sparrow', 'Brown-headed Cowbird', 'Field Sparrow', 'Squirrel']

class TestDetectionStrategy(unittest.TestCase):

    def setUp(self):
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger("TestDetectionStrategy")
        
        # Resolve project root from this file location: app/processor/tests/ -> ../../../
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.project_root = os.path.abspath(os.path.join(current_dir, '../../..'))
        
        # Paths
        self.binary_model_path = os.path.join(self.project_root, "app/processor/models/detection/nabirds_yolo11n_binary/weights/best_ncnn_model")
        self.classifier_model_path = os.path.join(self.project_root, "app/processor/models/classification/nabirds_yolo11n_cls/weights/best_ncnn_model")
        self.single_model_path = os.path.join(self.project_root, "app/processor/models/detection/nabirds_yolov8n_ncnn_model")
        self.sample_img_path = os.path.join(self.project_root, "app/data/samples/photos/1.jpg")

        # Check if resources exist
        self.two_stage_models_exist = (
            os.path.exists(self.binary_model_path) and 
            os.path.exists(self.classifier_model_path)
        )
        self.single_stage_exists = os.path.exists(self.single_model_path)
        self.img_exists = os.path.exists(self.sample_img_path)

        if not self.img_exists:
            self.logger.warning("Sample image not found. Using blank frame for tests.")
            self.frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        else:
            self.frame = cv2.imread(self.sample_img_path)

    def test_two_stage_strategy_integration(self):
        if not self.two_stage_models_exist:
            self.skipTest("Two-stage NCNN detection models not found.")
            
        self.logger.info("--- Testing TwoStageStrategy Integration ---")
        
        # Initialize
        strategy = TwoStageStrategy(
            self.binary_model_path, 
            self.classifier_model_path, 
            regional_species=regional_species
        )
        
        # Detect
        results = strategy.detect(self.frame, "bytetrack.yaml", 0.1)
        
        # Assertions
        self.logger.info(f"TwoStage Results: {results}")
        
        if self.img_exists:
            # We expect a Blue Jay in the sample image
            self.assertGreater(len(results), 0, "Should detect at least one bird in sample image")
            
            blue_jay_detected = any("Blue Jay" in res.class_name for res in results)
            self.assertTrue(blue_jay_detected, f"Should detect Blue Jay. Got: {[r.class_name for r in results]}")
            
            # Check properties
            first = results[0]
            self.assertIsNotNone(first.bbox)
            self.assertGreater(first.confidence, 0.0)

    def test_single_stage_strategy_integration(self):
        if not self.single_stage_exists:
            self.skipTest("Single-stage NCNN model not found.")

        self.logger.info("--- Testing SingleStageStrategy Integration ---")
        
        # Initialize
        strategy = SingleStageStrategy(
            self.single_model_path,
            regional_species=regional_species
        )

        # Detect
        results = strategy.detect(self.frame, "bytetrack.yaml", 0.1)

        # Assertions
        self.logger.info(f"SingleStage Results: {results}")

        if self.img_exists:
            self.assertGreater(len(results), 0, "Should detect at least one bird in sample image")
            
            blue_jay_detected = any("Blue Jay" in res.class_name for res in results)
            self.assertTrue(blue_jay_detected, f"Should detect Blue Jay. Got: {[r.class_name for r in results]}")

    def test_blur_detection_logic(self):
        self.logger.info("--- Testing Blur Detection Logic ---")
        strategy = TwoStageStrategy(
            self.binary_model_path, 
            self.classifier_model_path,
            blur_threshold=100.0
        )
        
        # 1. Create a sharp image (random noise often has high variance, or use a drawing)
        sharp_img = np.zeros((100, 100, 3), dtype=np.uint8)
        cv2.rectangle(sharp_img, (10, 10), (90, 90), (255, 255, 255), -1) # High contrast
        cv2.circle(sharp_img, (50, 50), 20, (0, 0, 0), -1)
        
        is_blurry = strategy.is_blurry(sharp_img)
        self.assertFalse(is_blurry, "Sharp image should not be detected as blurry")
        
        # 2. Create a blurry image
        blur_img = cv2.GaussianBlur(sharp_img, (21, 21), 0)
        is_blurry = strategy.is_blurry(blur_img)
        self.assertTrue(is_blurry, "Blurred image should be detected as blurry")

if __name__ == '__main__':
    unittest.main()
