import os
import time
import logging
from collections import Counter
from execution_timer import ExecutionTimer
from jetson_inference import detectNet, imageNet
from jetson_utils import videoSource, videoOutput, cudaAllocMapped, cudaCrop, saveImage
from classifier import Classifier

script_dir = os.path.dirname(os.path.abspath(__file__))

MIN_TRACK_FRAMES = 5


class FrameProcessor:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.cnt = 0
        self.tracks_to_preds = {}
        self.logger.info('Loading models...')
        test_frame = cudaAllocMapped(width=1920, height=1080, format="rgb8")

        # Load detector
        detector_file = os.path.join(
            script_dir, 'models', 'detection', 'ssd-mobilenet.onnx')
        labels = os.path.join(script_dir, 'models', 'detection', 'labels.txt')
        self.detector = detectNet(detector_file, threshold=0.5, labels=labels, input_blob="input_0",
                                  output_bbox="boxes", output_cvg="scores", argv=[f'--log-level=info'])
        self.detector.SetTrackingEnabled(True)
        self.detector.Detect(test_frame)
        # self.detector.SetTrackingParams(minFrames=3, dropFrames=15, overlapThreshold=0.5)

        # Load classifier.
        # classifier_file = os.path.join(script_dir, 'models', 'classification', 'resnet18.onnx')
        # labels = os.path.join(script_dir, 'models', 'classification', 'labels.txt')
        # self.classifier = imageNet(classifier_file, labels=labels, input_blob="input_0", output_blob="output_0")
        # self.classifier.Classify(test_frame)

        # Load classifier.
        self.classifier = Classifier()
        self.classifier.classify([test_frame])

        self.logger.info('Done loading models.')

    def run(self, img):
        self.cnt += 1
        if img is None:
            self.logger.error('Frame is missing in process_frame')
            return

        st = time.time()
        detections = self.detector.Detect(img, overlay="none")
        self.logger.debug(
            f'Detection Time: {(time.time() - st) * 1000} [msec]')
        if len(detections) == 0:
            return

        # Batch classification
        detections = [det for det in detections if det.TrackID != -
                      1 and det.TrackStatus == 1 and det.TrackFrames >= MIN_TRACK_FRAMES]
        if len(detections) == 0:
            return

        st = time.time()
        imgs = []
        for det in detections:
            crop_roi = (int(det.Left), int(det.Top),
                        int(det.Right), int(det.Bottom))
            bird_img = cudaAllocMapped(
                width=crop_roi[2] - crop_roi[0], height=crop_roi[3] - crop_roi[1], format=img.format)
            # crop the image to the ROI
            cudaCrop(img, bird_img, crop_roi)
            imgs.append(bird_img)
        self.logger.debug(
            f'Cropping Time : {(time.time() - st) * 1000} [msec] (detections: {len(detections)})')

        st = time.time()
        class_descs = self.classifier.classify(imgs)
        self.logger.debug(
            f'Classification Time : {(time.time() - st) * 1000} [msec] (images: {len(imgs)})')

        for i in range(len(imgs)):
            det = detections[i]
            class_desc = class_descs[i]
            self.logger.debug(
                f'Track Info: Track ID: {det.TrackID}, Status: {det.TrackStatus}, Frames: {det.TrackFrames}, Lost: {det.TrackLost}')
            if det.TrackID not in self.tracks_to_preds:
                self.tracks_to_preds[det.TrackID] = []
            self.tracks_to_preds[det.TrackID].append(class_desc)

    def get_results(self):
        fps = 10
        tracks_to_preds = {track_id: preds for track_id,
                           preds in self.tracks_to_preds.items() if len(preds) >= 5 * fps}
        most_common_preds = {track_id: Counter(preds).most_common(
            1)[0][0] for track_id, preds in tracks_to_preds.items()}
        predictions_array = list(most_common_preds.values())
        self.logger.info(predictions_array)

    def close(self):
        self.logger.info('closing frame processor')
        self.classifier.close()
