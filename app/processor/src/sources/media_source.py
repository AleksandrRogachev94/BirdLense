import logging
import threading
import io
import multiprocessing
import socketserver
from http import server
from threading import Condition
from picamera2 import Picamera2
from picamera2.encoders import H264Encoder, JpegEncoder, Quality
from picamera2.outputs import FileOutput
from .ffmpeg_output_mono_audio import FfmpegOutputMonoAudio
import cv2


class StreamingOutput(io.BufferedIOBase):
    """Manages streaming frame buffer with thread-safe updates."""

    def __init__(self):
        self.frame = None
        self.condition = Condition()

    def write(self, buf: bytes) -> int:
        with self.condition:
            self.frame = buf
            self.condition.notify_all()
        return len(buf)


class StreamingHandler(server.BaseHTTPRequestHandler):
    """Handles HTTP requests for video streaming."""

    def do_GET(self):
        self.server.control_queue.put(("client_connect", None))
        try:
            self.send_response(200)
            self.send_header('Cache-Control', 'no-cache, private')
            self.send_header(
                'Content-Type', 'multipart/x-mixed-replace; boundary=FRAME')
            self.end_headers()

            output = self.server.streaming_output
            while True:
                with output.condition:
                    output.condition.wait()
                    frame = output.frame
                self.wfile.write(b'--FRAME\r\n')
                self.send_header('Content-Type', 'image/jpeg')
                self.send_header('Content-Length', str(len(frame)))
                self.end_headers()
                self.wfile.write(frame)
        except Exception as e:
            logging.warning(f"Client disconnected: {e}")
        finally:
            self.server.control_queue.put(("client_disconnect", None))


class StreamingServer(socketserver.ThreadingMixIn, server.HTTPServer):
    """Custom HTTP server for video streaming."""
    allow_reuse_address = True
    daemon_threads = True


def start_streaming_server(streaming_output: StreamingOutput, control_queue: multiprocessing.Queue, port: int = 8082):
    """Starts the streaming server."""
    server = StreamingServer(('0.0.0.0', port), StreamingHandler)
    server.streaming_output = streaming_output
    server.control_queue = control_queue
    threading.Thread(target=server.serve_forever, daemon=True).start()
    logging.info('Started streaming server')
    return server


def recording_worker(control_queue: multiprocessing.Queue, frame_queue: multiprocessing.Queue, main_size: tuple, lores_size: tuple):
    """Handles video processing and streaming."""
    logging.info("Recording worker started")
    picam2 = Picamera2()
    picam2.configure(picam2.create_video_configuration(
        {"size": main_size}, encode="main"))
    stream_output = StreamingOutput()
    start_streaming_server(stream_output, control_queue)

    encoder = H264Encoder()
    stream_encoder = JpegEncoder()
    stream_encoder.output = [FileOutput(stream_output)]

    recording = processor_active = False
    active_clients = 0

    while True:
        command, data = control_queue.get()
        logging.debug(
            f"Command: {command}, Data: {data}, Clients: {active_clients}")

        if command == "start":
            processor_active = True
            output = FfmpegOutputMonoAudio(data, audio=True,
                                           audio_samplerate=48000, audio_codec="aac",
                                           audio_bitrate=128000)
            encoder.output = [output]
            picam2.start_encoder(encoder, quality=Quality.MEDIUM)
            if not recording:
                picam2.start()
                recording = True
            # push first frame to signal that recording has started
            frame_queue.put(picam2.capture_array("main"))
        elif command == "stop":
            processor_active = False
            picam2.stop_encoder(encoder)
            if not active_clients:
                picam2.stop()
                recording = False
            # put empty frame to signal that recording has stopped
            frame_queue.put(None)
        elif command == "capture":
            frame_queue.put(picam2.capture_array("main"))
        elif command == "client_connect":
            active_clients += 1
            if active_clients == 1:
                picam2.start_encoder(stream_encoder, quality=Quality.LOW)
            if not recording:
                picam2.start()
                recording = True
        elif command == "client_disconnect":
            active_clients -= 1
            if not active_clients:
                picam2.stop_encoder(stream_encoder)
                if not processor_active:
                    picam2.stop()
                    recording = False
        elif command == "exit":
            break

    logging.info("Shutting down recording worker")


class MediaSource:
    """Manages camera recording and streaming."""

    def __init__(self, main_size: tuple = (1280, 720), lores_size: tuple = (640, 640)):
        self.frame_queue = multiprocessing.Queue(maxsize=1)
        self.control_queue = multiprocessing.Queue()
        self.process = multiprocessing.Process(
            target=recording_worker,
            args=(self.control_queue, self.frame_queue, main_size, lores_size),
        )
        self.process.start()

    def start_recording(self, output: str):
        self.control_queue.put(("start", output))
        # capture first frame before proceeding to make sure camera is running
        self.frame_queue.get()

    def stop_recording(self):
        self.control_queue.put(("stop", None))
        # capture empty frame before proceeding to make sure camera is stopped
        self.frame_queue.get()

    def capture(self):
        self.control_queue.put(("capture", None))
        # it's RGB in reality, no need to convert cv2.COLOR_YUV420p2RGB, some weird picamera2 behavior
        image = self.frame_queue.get()
        # return BGR
        return cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

    def close(self):
        self.control_queue.put(("exit", None))
        self.process.join()
