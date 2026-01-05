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

CONFIDENCE_THRESHOLD = 0.5
MODEL = "gemini-3-flash-preview"

# Rate limiting defaults
DEFAULT_MAX_CALLS_PER_HOUR = 20
DEFAULT_MAX_CALLS_PER_DAY = 100

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
    
    def __init__(self, api_key: str, log_dir: str = None,
                 max_calls_per_hour: int = DEFAULT_MAX_CALLS_PER_HOUR,
                 max_calls_per_day: int = DEFAULT_MAX_CALLS_PER_DAY):
        self.client = genai.Client(api_key=api_key)
        self.log_dir = log_dir
        
        # Rate limiting
        self.max_calls_per_hour = max_calls_per_hour
        self.max_calls_per_day = max_calls_per_day
        self.calls_this_hour = 0
        self.calls_this_day = 0
        self.hour_reset_time = datetime.now()
        self.day_reset_date = datetime.now().date()
        
        logger.info(f"LLMVerifier initialized (limits: {max_calls_per_hour}/hour, {max_calls_per_day}/day)")
    
    def _check_and_reset_limits(self):
        """Reset counters if hour/day has passed."""
        now = datetime.now()
        
        # Reset hourly counter
        if (now - self.hour_reset_time).total_seconds() >= 3600:
            self.calls_this_hour = 0
            self.hour_reset_time = now
        
        # Reset daily counter
        if now.date() > self.day_reset_date:
            self.calls_this_day = 0
            self.day_reset_date = now.date()
    
    def _is_rate_limited(self) -> bool:
        """Check if we've exceeded rate limits."""
        self._check_and_reset_limits()
        return (self.calls_this_hour >= self.max_calls_per_hour or 
                self.calls_this_day >= self.max_calls_per_day)
    
    def should_verify(self, confidence: float) -> bool:
        if confidence >= CONFIDENCE_THRESHOLD:
            return False
        if self._is_rate_limited():
            logger.warn("LLM verification skipped - rate limit reached")
            return False
        return True
    
    def verify(self, crop: np.ndarray, detected_species: str) -> dict:
        """Verify if detection is plausible."""
        if crop is None or crop.size == 0:
            return {'is_plausible': False, 'reasoning': 'Empty image'}
        
        # Increment rate limit counters
        self.calls_this_hour += 1
        self.calls_this_day += 1
        
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
