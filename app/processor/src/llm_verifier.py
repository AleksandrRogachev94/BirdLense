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

PROMPT = """You are verifying a bird detection from a feeder camera.
The ML model detected: "{detected_species}"
Observation time: {datetime}
Location: {latitude}, {longitude}

Is this detection plausible? Check:
- Is there an actual bird clearly visible? The image must show a real bird with identifiable features (shape, feathers, beak, etc.) - reject silhouettes, shadows, blurs, leaves, or other objects
- Could it reasonably be a {detected_species}?
- Is this species plausible for this location and time of year?

Be lenient on exact species ID - only reject if obviously wrong or if no actual bird is visible."""


class VerificationResult(BaseModel):
    """Simple plausibility check."""
    is_plausible: bool = Field(description="Is this a plausible bird detection?")
    reasoning: str = Field(description="One sentence brief explanation")


class LLMVerifier:
    """Verifies bird detections using Gemini."""
    
    def __init__(
        self,
        api_key: str,
        model: str,
        min_confidence: float,
        max_calls_per_hour: int,
        max_calls_per_day: int,
        latitude: float = None,
        longitude: float = None,
        log_dir: str = None,
    ):
        self.client = genai.Client(api_key=api_key)
        self.log_dir = log_dir
        self.model = model
        self.latitude = latitude
        self.longitude = longitude
        self.min_confidence = min_confidence
        
        # Rate limiting
        self.max_calls_per_hour = max_calls_per_hour
        self.max_calls_per_day = max_calls_per_day
        self.calls_this_hour = 0
        self.calls_this_day = 0
        self.hour_reset_time = datetime.now()
        self.day_reset_date = datetime.now().date()
        
        logger.info(f"LLMVerifier initialized (model: {model}, min_conf: {min_confidence}, limits: {max_calls_per_hour}/hour, {max_calls_per_day}/day)")
    
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
        if confidence >= self.min_confidence:
            return False
        if self._is_rate_limited():
            logger.warn("LLM verification skipped - rate limit reached")
            return False
        return True
    
    def verify(self, crop: np.ndarray, detected_species: str, observation_time: datetime = None) -> dict:
        """Verify if detection is plausible."""
        if crop is None or crop.size == 0:
            return {'is_plausible': False, 'reasoning': 'Empty image'}
        
        # Increment rate limit counters
        self.calls_this_hour += 1
        self.calls_this_day += 1
        
        try:
            _, buffer = cv2.imencode('.jpg', crop, [cv2.IMWRITE_JPEG_QUALITY, 85])
            
            # Format datetime for the prompt
            dt_str = observation_time.strftime('%Y-%m-%d %H:%M') if observation_time else 'Unknown'
            lat_str = str(self.latitude) if self.latitude is not None else 'Unknown'
            lon_str = str(self.longitude) if self.longitude is not None else 'Unknown'
            
            prompt = PROMPT.format(
                detected_species=detected_species,
                datetime=dt_str,
                latitude=lat_str,
                longitude=lon_str
            )
            
            response = self.client.models.generate_content(
                model=self.model,
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
        """Save verification to persistent log folder organized by year/month/day."""
        if not self.log_dir:
            return
        
        now = datetime.now()
        # Create year/month/day folder structure
        date_folder = os.path.join(self.log_dir, now.strftime('%Y'), now.strftime('%m'), now.strftime('%d'))
        os.makedirs(date_folder, exist_ok=True)
        
        timestamp = now.strftime('%H%M%S')
        log_path = os.path.join(date_folder, f'{timestamp}_track{track_id}')
        
        cv2.imwrite(f'{log_path}.jpg', crop)
        with open(f'{log_path}.json', 'w') as f:
            json.dump({
                'species': detection.get('species_name'),
                'confidence': detection.get('confidence'),
                'llm_result': result
            }, f, indent=2)
    
    def validate_detections(self, detections: List[dict], observation_time: datetime = None) -> List[dict]:
        """Validate detections, returns only plausible ones."""
        validated = []
        for det in detections:
            # Skip LLM verification for squirrels
            if det.get('species_name') == 'Squirrel':
                validated.append(det)
                continue
            
            if not self.should_verify(det['confidence']) or det.get('best_frame') is None:
                validated.append(det)
                continue
            
            result = self.verify(det['best_frame'], det['species_name'], observation_time)
            self._save_log(det.get('track_id', 0), det['best_frame'], det, result)
            
            if result['is_plausible']:
                validated.append(det)
            else:
                logger.info(f"LLM rejected: {det['species_name']} - {result['reasoning']}")
        
        return validated
