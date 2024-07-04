import time
from jetson_utils import videoSource
from frame_processor import FrameProcessor
from fps_tracker import FPSTracker
import logging

# Configure the root logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),  # Logs to the console
        # logging.handlers.RotatingFileHandler(
        #     'app.log',            # Log file name
        #     maxBytes=5*1024*1024, # Maximum file size in bytes (e.g., 5 MB)
        #     backupCount=3         # Number of backup files to keep
        # )
    ]
)


def main():

    frame_processor = FrameProcessor()
    # Configure video sources
    capture = 'data/videos/video3.mp4'
    output = 'data/output/out.mp4'

    capture_config = ['--headless', '--input-width=1920', '--input-height=1080',
                      '--input-codec=mjpeg', '--input-rate=30', f'--input-save={output}']
    video_capture = videoSource(capture, argv=capture_config)

    try:
        i = 0
        while True:
            i += 1
            frame = video_capture.Capture()
            if frame is None:
                break

            with FPSTracker():
                frame_processor.run(frame)
            logging.debug(f'iteration {i}')

            # exit on input/output EOS
            if not video_capture.IsStreaming():
                break
            time.sleep(0.005)
    finally:
        logging.info('Main loop stopped')
        frame_processor.get_results()
        frame_processor.close()
        video_capture.Close()


if __name__ == "__main__":
    main()
