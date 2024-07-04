import threading
from jetson_utils import videoSource, videoOutput, cudaAllocMapped, cudaMemcpy

class Recorder:
    def __init__(self):
        self.video_capture = None  # Initialize video capture source
        self.video_output = None   # Initialize video output
        self.frame = None          # Initialize frame storage
        self.read_thread = None    # Initialize thread handle
        self.read_lock = threading.Lock()  # Initialize thread lock
        self.running = False       # Flag to control thread execution
        self.running_lock = threading.Lock()  # Initialize thread lock

    def start(
        self,
        capture,
        output,
        capture_config=['--input-width=1920', '--input-height=1080', '--input-codec=mjpeg'],
        output_config=['--headless', '--output-width=1920', '--output-height=1080', '--output-frameRate=30', '--output-codec=h264', '--bitrate=4000000']
    ):
        with self.running_lock:
            if self.running:
                print('Video capturing is already running')
                return

        try:
            # Initialize video source and output
            self.video_capture = videoSource(capture, argv=capture_config)
            self.video_output = videoOutput(output, argv=output_config)
            # Capture initial frame
            self.frame = self.video_capture.Capture()

            # Start thread for continuous camera reading
            self.running = True
            self.read_thread = threading.Thread(target=self.updateCamera)
            self.read_thread.start()
        except RuntimeError as e:
            # Cleanup if initialization fails
            self.video_capture = None
            self.video_output = None
            print("Unable to open camera: ", e)

    def stop(self):
        # Stop thread and clean up resources
        with self.running_lock:
            self.running = False
        if self.read_thread:
            self.read_thread.join()
            self.read_thread = None
        self.release_videos()
       
    
    def release_videos(self):
        if self.video_capture:
            self.video_capture.Close()
            self.video_capture = None

        if self.video_output:
            self.video_output.Close()
            self.video_output = None

    def updateCamera(self):
        while self.video_capture.IsStreaming():
            with self.running_lock:
                if not self.running:
                    break
            print('--- recorder frame')
            try:
                # Capture frame and check for end of stream
                frame = self.video_capture.Capture()
                if frame is None:
                    break

                # Update frame under lock to ensure thread safety
                with self.read_lock:
                    self.frame = frame

                # Render frame to output
                self.video_output.Render(frame)
            except RuntimeError as e:
                # Handle read errors gracefully
                print("--- Could not read image from camera: ", e)
                break
        # Clean up resources after capture closed or something bad happened
        print('--- end of updateCamera')
        with self.running_lock:
            self.running = False
        self.release_videos()

    def read(self):
        with self.running_lock:
            if not self.running:
                print('Recorder is not running') 
                return None
        
        with self.read_lock:
            if self.frame is None:
                return None  # Handle case where frame is not available (end of stream)
            frame = cudaAllocMapped(width=self.frame.width, height=self.frame.height, format=self.frame.format)
            cudaMemcpy(frame, self.frame)
        return frame
            