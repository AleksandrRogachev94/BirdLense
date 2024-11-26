import logging
import multiprocessing
import cv2
import time


def recording_worker(control_queue, frame_queue, video_path, main_size, lores_size):
    """
    Subprocess that does video processing
    """
    logger = logging.getLogger(__name__)
    cap = cv2.VideoCapture(video_path)
    fourcc = cv2.VideoWriter_fourcc(*'avc1')

    out = None
    recording = False

    while True:
        if not control_queue.empty():
            command, data = control_queue.get(block=False)  # don't block loop
            logger.debug(
                f'VideoSource received command. Command: {command}, Data: {data}')

            if command == "start":
                out = cv2.VideoWriter(data, fourcc, 10.0, main_size)
                recording = True
            elif command == "stop":
                if out is not None:
                    out.release()
                    out = None
                recording = False
            elif command == "exit":
                break

        if recording and cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                logger.info('Loooping video')
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # loop video
                continue
            frame_main = cv2.resize(frame, main_size)
            frame_lores = cv2.resize(frame, lores_size)
            out.write(frame_main)
            try:
                if frame_queue.full():
                    frame_queue.get(block=False)
            except:
                pass
            frame_queue.put(frame_lores)
        time.sleep(0.05)  # Release CPU to do some real processing

    if out is not None:
        out.release()
    cap.release()


class VideoFileSource:
    """
    This class is used as a replacement for CameraSource for testing only.
    Instead of using camera input, it's reading  frames from a video file.
    Just like CameraSource, it's using a subprocess to avoid skipping frames
    """

    def __init__(self, video_path, main_size=(1280, 720), lores_size=(640, 640)):
        self.logger = logging.getLogger(__name__)
        self.frame_queue = multiprocessing.Queue(maxsize=1)
        self.control_queue = multiprocessing.Queue()
        self.video_path = video_path

        self.recording_process = multiprocessing.Process(
            target=recording_worker, args=(self.control_queue, self.frame_queue, video_path, main_size, lores_size))
        self.recording_process.start()

    def start_recording(self, output):
        self.logger.info('Start video recording')
        self.control_queue.put(("start", output))

    def stop_recording(self):
        self.logger.info('Stop video recording')
        self.control_queue.put(("stop", None))

    def capture(self):
        self.control_queue.put(("capture", None))
        return self.frame_queue.get()

    def close(self):
        if self.recording_process is not None:
            self.control_queue.put("exit")
            self.recording_process.join()
