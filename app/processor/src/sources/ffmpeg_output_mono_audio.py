import gc
import signal
import subprocess
import prctl
from picamera2.outputs import Output


class FfmpegOutputMonoAudio(Output):
    """
    Picamera2-specific class to handle FFmpeg output with mono audio using ALSA.
    This class is a modified version of the FfmpegOutput class from the Picamera2 library.
    It has been adapted to force mono audio output instead of the default stereo.
    """

    def __init__(self, output_filename, audio=False, audio_device="hw:1,0", audio_sync=-0.3,
                 audio_samplerate=48000, audio_codec="aac", audio_bitrate=128000, pts=None):
        super().__init__(pts=pts)
        self.ffmpeg = None
        self.output_filename = output_filename
        self.audio = audio
        self.audio_device = audio_device
        self.audio_sync = audio_sync
        self.audio_samplerate = audio_samplerate
        self.audio_codec = audio_codec
        self.audio_bitrate = audio_bitrate
        self.timeout = 1 if audio else None
        self.error_callback = None
        self.needs_pacing = True

    def start(self):
        general_options = ['-loglevel', 'warning', '-y']
        video_input = ['-use_wallclock_as_timestamps', '1',
                       '-thread_queue_size', '64',
                       '-i', '-']
        video_codec = ['-c:v', 'copy']
        audio_input = []
        audio_codec = []

        if self.audio:
            audio_input = [
                '-itsoffset', str(self.audio_sync),
                '-f', 'alsa',
                '-sample_rate', str(self.audio_samplerate),
                '-channels', '1',  # Explicitly set mono
                '-thread_queue_size', '1024',
                '-i', self.audio_device
            ]
            audio_codec = [
                '-b:a', str(self.audio_bitrate),
                '-c:a', self.audio_codec,
                '-ac', '1'  # Force mono output
            ]

        command = ['ffmpeg'] + general_options + audio_input + video_input + \
            audio_codec + video_codec + self.output_filename.split()

        self.ffmpeg = subprocess.Popen(command, stdin=subprocess.PIPE,
                                       preexec_fn=lambda: prctl.set_pdeathsig(signal.SIGKILL))
        super().start()

    def stop(self):
        super().stop()
        if self.ffmpeg is not None:
            self.ffmpeg.stdin.close()
            try:
                self.ffmpeg.wait(timeout=self.timeout)
            except subprocess.TimeoutExpired:
                try:
                    self.ffmpeg.terminate()
                    self.ffmpeg.wait()  # Ensure process cleanup
                except Exception:
                    pass
            self.ffmpeg = None
            gc.collect()

    def outputframe(self, frame, keyframe=True, timestamp=None, packet=None, audio=False):
        if audio:
            raise RuntimeError(
                "FfmpegOutput does not support audio packets from Picamera2")
        if self.recording and self.ffmpeg:
            try:
                self.ffmpeg.stdin.write(frame)
                self.ffmpeg.stdin.flush()
            except Exception as e:
                self.ffmpeg = None
                if self.error_callback:
                    self.error_callback(e)
            else:
                self.outputtimestamp(timestamp)
