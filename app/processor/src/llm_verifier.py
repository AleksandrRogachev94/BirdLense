"""
LLM-based plausibility verification for bird detections using Google Gemini.
"""

import json
import logging
import os
from datetime import datetime
from typing import List

import cv2
import numpy as np
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

CONFIDENCE_THRESHOLD = 0.7
MODEL = "gemini-3-flash-preview"

PROMPT = """You are verifying a bird detection from a feeder camera.
The ML model detected: "{detected_species}"

Is this detection plausible? Check:
- Is there a bird clearly visible? (not a leaf, shadow, or blur)
- Could it reasonably be a {detected_species}?

Be lenient - only reject if obviously wrong."""


class VerificationResult(BaseModel):
    """Simple plausibility check."""
    is_plausible: bool = Field(description="Is this a plausible bird detection?")
    reasoning: str = Field(description="One sentence brief explanation")


class LLMVerifier:
    """Verifies bird detections using Gemini."""
    
    def __init__(self, api_key: str, log_dir: str = None):
        self.client = genai.Client(api_key=api_key)
        self.log_dir = log_dir
        logger.info("LLMVerifier initialized")
    
    def should_verify(self, confidence: float) -> bool:
        return confidence < CONFIDENCE_THRESHOLD
    
    def verify(self, crop: np.ndarray, detected_species: str) -> dict:
        """Verify if detection is plausible."""
        if crop is None or crop.size == 0:
            return {'is_plausible': False, 'reasoning': 'Empty image'}
        
        try:
            _, buffer = cv2.imencode('.jpg', crop, [cv2.IMWRITE_JPEG_QUALITY, 85])
            prompt = PROMPT.format(detected_species=detected_species)
            
            response = self.client.models.generate_content(
                model=MODEL,
                contents=[types.Content(role="user", parts=[
                    types.Part.from_bytes(data=buffer.tobytes(), mime_type="image/jpeg"),
                    types.Part.from_text(text=prompt)
                ])],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=VerificationResult
                )
            )
            
            parsed = VerificationResult.model_validate_json(response.text)
            result = {'is_plausible': parsed.is_plausible, 'reasoning': parsed.reasoning}
            logger.info(f"LLM: plausible={result['is_plausible']} - {result['reasoning']}")
            return result
            
        except Exception as e:
            logger.error(f"LLM verification failed: {e}")
            return {'is_plausible': True, 'reasoning': f'Error: {e}'}
    
    def _save_log(self, track_id: int, crop: np.ndarray, detection: dict, result: dict):
        """Save verification to persistent log folder."""
        if not self.log_dir:
            return
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        log_path = os.path.join(self.log_dir, f'{timestamp}_track{track_id}')
        os.makedirs(self.log_dir, exist_ok=True)
        
        cv2.imwrite(f'{log_path}.jpg', crop)
        with open(f'{log_path}.json', 'w') as f:
            json.dump({
                'species': detection.get('species_name'),
                'confidence': detection.get('confidence'),
                'llm_result': result
            }, f, indent=2)
    
    def validate_detections(self, detections: List[dict]) -> List[dict]:
        """Validate detections, returns only plausible ones."""
        validated = []
        for det in detections:
            if not self.should_verify(det['confidence']) or det.get('best_frame') is None:
                validated.append(det)
                continue
            
            result = self.verify(det['best_frame'], det['species_name'])
            self._save_log(det.get('track_id', 0), det['best_frame'], det, result)
            
            if result['is_plausible']:
                validated.append(det)
            else:
                logger.info(f"LLM rejected: {det['species_name']} - {result['reasoning']}")
        
        return validated
