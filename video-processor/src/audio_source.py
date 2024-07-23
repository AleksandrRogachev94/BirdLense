import subprocess
import logging


class AudioSource:
    def __init__(self, output_file, device='plughw:3,0'):
        self.output_file = output_file
        self.arecord_process = None
        self.lame_process = None
        self.device = device
        self.logger = logging.getLogger(__name__)

    def start_recording(self):
        # Example command: arecord -f S16_LE -c 1 -r 48000 -t wav -D plughw:2,0 | lame --preset=standard - data/test2.mp3
        # arecord command to capture audio in raw format
        arecord_cmd = [
            "arecord",
            "-f", "S16_LE",    # Signed 16-bit little-endian format
            "-c", "1",         # 1 channel (mono)
            "-r", "48000",     # Sample rate of 48000 Hz
            "-t", "wav",       # Output wav audio data
            "-D", self.device  # Device
        ]

        # lame command to encode raw audio to MP3
        lame_cmd = [
            "lame",
            "--preset", "standard",  # Use standard MP3 settings
            "-",                     # Read from standard input
            self.output_file         # Output MP3 file
        ]

        # Start arecord process
        self.arecord_process = subprocess.Popen(
            arecord_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        # Start lame process with arecord's stdout as its stdin
        self.lame_process = subprocess.Popen(
            lame_cmd, stdin=self.arecord_process.stdout, stderr=subprocess.PIPE)

    def stop_recording(self):
        if self.arecord_process:
            # Terminate the arecord process
            self.arecord_process.terminate()
            try:
                stdout, stderr = self.arecord_process.communicate(timeout=5)
                # if stderr:
                #     self.logger.error(
                #         f"arecord stderr: {stderr.decode('utf-8')}")
            except subprocess.TimeoutExpired:
                self.arecord_process.kill()
                stdout, stderr = self.arecord_process.communicate()
                if stderr:
                    self.logger.error(
                        f"arecord stderr: {stderr.decode('utf-8')}")

        if self.lame_process:
            # Wait for lame process to finish encoding
            stdout, stderr = self.lame_process.communicate()
            # if stderr:
            #     self.logger.error(f"lame stderr: {stderr.decode('utf-8')}")
