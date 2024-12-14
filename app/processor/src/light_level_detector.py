import logging
import numpy as np
import cv2


class LightLevelDetector:
    """Simple detector for checking if there's enough light for processing."""
    
    def __init__(self, min_brightness=30, min_contrast=20):
        """
        Args:
            min_brightness: Minimum average brightness (0-255)
            min_contrast: Minimum contrast (standard deviation of brightness)
        """
        self.min_brightness = min_brightness
        self.min_contrast = min_contrast
        self.logger = logging.getLogger(__name__)

    def has_sufficient_light(self, frame):
        """
        Check if frame has sufficient lighting for processing.
        
        Args:
            frame: BGR format numpy array from camera
            
        Returns:
            bool: True if lighting conditions are good enough for processing
        """
        try:
            # Convert to grayscale for brightness calculation
            gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
            
            # Calculate mean brightness and contrast
            mean_brightness = np.mean(gray)
            contrast = np.std(gray)

            is_sufficient = (mean_brightness >= self.min_brightness and 
                           contrast >= self.min_contrast)

            print(mean_brightness, contrast)

            if not is_sufficient:
                self.logger.info(
                    f'Poor lighting conditions detected: brightness={mean_brightness:.1f}, '
                    f'contrast={contrast:.1f}'
                )

            return is_sufficient

        except Exception as e:
            self.logger.error(f'Error checking light levels: {e}')
            # On error, assume lighting is ok to not block processing
            return True