from gpiozero import MotionSensor


class PIRMotionDetector():
    def __init__(self, pin=4):
        self.pir = MotionSensor(pin)

    def detect(self):
        self.pir.wait_for_motion()
        return True
