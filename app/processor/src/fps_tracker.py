from timeit import default_timer
import logging
from statistics import mean, median
from typing import List


class FPSTracker:
    def __init__(self):
        self.timer = default_timer
        self.frame_times: List[float] = []
        self.logger = logging.getLogger(__name__)
        self.reset()

    def reset(self):
        """Reset tracking stats for new motion detection sequence"""
        self.frame_times.clear()
        self.start_time = None
        self.total_frames = 0

    def __call__(self):
        return self.timer()

    def __enter__(self):
        self.start_time = self()
        return self

    def __exit__(self, exc_type, exc_value, exc_traceback):
        frame_time = self() - self.start_time
        self.frame_times.append(frame_time)
        self.total_frames += 1

    def log_summary(self):
        """Log FPS statistics for the completed motion sequence"""
        if not self.frame_times:
            return

        # Calculate FPS stats
        fps_values = [1 / t for t in self.frame_times]
        avg_fps = 1 / mean(self.frame_times)
        median_fps = 1 / median(self.frame_times)
        min_fps = 1 / max(self.frame_times)  # Slowest frame
        max_fps = 1 / min(self.frame_times)  # Fastest frame

        total_time = sum(self.frame_times)

        self.logger.info(
            f"FPS Summary: {self.total_frames} frames in {total_time:.1f}s | "
            f"Avg: {avg_fps:.1f} | Med: {median_fps:.1f} | "
            f"Min: {min_fps:.1f} | Max: {max_fps:.1f}"
        )

        self.reset()  # Clear stats for next motion sequence
