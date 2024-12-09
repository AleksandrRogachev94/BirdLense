import time


class FakeMotionDetector():
    def __init__(self, wait=60, motion=False):
        self.wait = wait
        self.motion = motion

    def detect(self):
        time.sleep(self.wait)
        return self.motion
