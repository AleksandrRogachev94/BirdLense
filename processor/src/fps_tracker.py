from timeit import default_timer
import logging

logger = logging.getLogger(__name__)


class FPSTracker:
    def __init__(self):
        self.timer = default_timer
        self.end_time = None

    def __call__(self):
        return self.timer()

    def __enter__(self):
        self.start_time = self()
        return self

    def __exit__(self, exc_type, exc_value, exc_traceback):
        self.end_time = self()
        logging.debug(f"FPS: {1 / (self.end_time - self.start_time)}")
