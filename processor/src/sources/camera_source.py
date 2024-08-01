import logging
import multiprocessing
from picamera2 import Picamera2
from picamera2.encoders import H264Encoder, Quality
from picamera2.outputs import FfmpegOutput
import cv2


def recording_worker(control_queue, frame_queue, main_size, lores_size):
    """
    Subprocess that does video processing.
    It must be a subprocess to avoid skipping frames in the resulting video file
    """
    logger = logging.getLogger(__name__)

    picam2 = Picamera2()
    # Main stream gets recorded file, lores stream is used for object detection
    main_stream = {"size": main_size, "format": "RGB888"}
    # lores_stream = {"size": lores_size, "format": "YUV420"}
    # video_config = picam2.create_video_configuration(
    #     main_stream, lores_stream, encode="main")
    video_config = picam2.create_video_configuration(
        main_stream, encode="main")
    picam2.align_configuration(video_config)
    picam2.configure(video_config)
    encoder = H264Encoder()

    while True:
        command, data = control_queue.get()
        logger.debug(
            f'CameraSource received command. Command: {command}, Data: {data}', )
        if command == "start":
            picam2.start_recording(encoder, FfmpegOutput(
                data), quality=Quality.MEDIUM)
        elif command == "stop":
            picam2.stop_recording()
        elif command == "capture":
            # frame = picam2.capture_array('lores')
            frame = picam2.capture_array('main')
            frame_queue.put(frame)
        elif command == "exit":
            break


class CameraSource:
    """
    This class captures camera stream to a video file and supplies latest frames on-demand.
    Video recording is done in a separate subprocess to avoid skipping frames in the resulting video
    """

    def __init__(self, main_size=(1280, 720), lores_size=(640, 640)):
        self.logger = logging.getLogger(__name__)
        self.frame_queue = multiprocessing.Queue(maxsize=1)
        self.control_queue = multiprocessing.Queue()

        self.recording_process = multiprocessing.Process(
            target=recording_worker, args=(self.control_queue, self.frame_queue, main_size, lores_size))
        self.recording_process.start()

    def start_recording(self, output):
        self.logger.info(f'Start camera recording to "{output}"')
        self.control_queue.put(("start", output))

    def stop_recording(self):
        self.logger.info(f'Stop camera recording')
        self.control_queue.put(("stop", None))

    def capture(self):
        self.control_queue.put(("capture", None))
        frame = self.frame_queue.get()
        # it's BGR in reality, some weird picamera2 behavior
        return frame
        # return cv2.cvtColor(frame, cv2.COLOR_YUV420p2RGB)

    def close(self):
        if self.recording_process is not None:
            self.control_queue.put("exit")
            self.recording_process.join()
