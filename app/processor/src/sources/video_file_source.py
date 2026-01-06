import logging
import cv2
import time


class VideoFileSource:
    """
    Video file source that accurately simulates real camera behavior:
    - Tracks elapsed time between capture() calls
    - Skips frames that would have passed during processing
    - Writes ALL frames to disk (skipped ones too)
    """

    def __init__(self, video_path, main_size=(1280, 720), lores_size=(640, 640)):
        self.logger = logging.getLogger(__name__)
        self.cap = cv2.VideoCapture(video_path)
        self.main_size = main_size
        self.lores_size = lores_size
        self.out = None
        self.fourcc = cv2.VideoWriter_fourcc(*'avc1')
        
        self.source_fps = self.cap.get(cv2.CAP_PROP_FPS) or 30.0
        self.frame_interval = 1.0 / self.source_fps
        self.last_capture_time = None
        self.frame_count = 0
        
        self.logger.info(f'VideoFileSource: {self.source_fps} FPS')

    def start_recording(self, output):
        self.logger.info(f'Start video recording to {output}')
        self.out = cv2.VideoWriter(output, self.fourcc, self.source_fps, self.main_size)
        self.frame_count = 0
        self.last_capture_time = None  # Will be set on first capture

    def stop_recording(self):
        self.logger.info('Stop video recording')
        if self.out is not None:
            self.out.release()
            self.out = None

    def capture(self):
        """
        Get next frame for processing.
        Advances video by elapsed real time, writing skipped frames to disk.
        Returns None when video ends.
        """
        if not self.cap.isOpened():
            return None
        
        # Calculate how many frames should have passed since last capture
        now = time.time()
        if self.last_capture_time is None:
            # First capture - start the clock now (syncs with frame_processor)
            frames_to_advance = 1
        else:
            elapsed = now - self.last_capture_time
            frames_to_advance = max(1, int(elapsed / self.frame_interval))
        self.last_capture_time = now
        
        # Read and write frames, return only the last one
        result_frame = None
        for _ in range(frames_to_advance):
            ret, frame = self.cap.read()
            if not ret:
                self.logger.info(f'Video ended after {self.frame_count} frames')
                return None
            
            self.frame_count += 1
            
            # Write ALL frames to disk
            if self.out is not None:
                frame_main = cv2.resize(frame, self.main_size)
                self.out.write(frame_main)
            
            result_frame = frame
        
        return cv2.resize(result_frame, self.lores_size) if result_frame is not None else None

    def close(self):
        self.stop_recording()
        if self.cap is not None:
            self.cap.release()
