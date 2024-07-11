import time
import logging
from collections import Counter
from jetson_inference import detectNet
from jetson_utils import cudaAllocMapped, cudaCrop
from classifier import Classifier

ROUGH_FPS = 10  # Approximate run() fps. Adjust based on hardware
MIN_TRACK_SECONDS = 5  # Minimum number seconds for a track to be included in the results
MIN_TRACK_FRAMES = ROUGH_FPS * MIN_TRACK_SECONDS


class FrameProcessor:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.reset()
        self.logger.info('Loading models...')
        test_frame = cudaAllocMapped(width=1920, height=1080, format="rgb8")

        # Load detector
        detector_file = 'models/detection/ssd-mobilenet.onnx'
        labels = 'models/detection/labels.txt'
        self.detector = detectNet(detector_file, threshold=0.5, labels=labels, input_blob="input_0",
                                  output_bbox="boxes", output_cvg="scores")
        self.detector.SetTrackingEnabled(True)
        self.detector.Detect(test_frame)
        # self.detector.SetTrackingParams(minFrames=3, dropFrames=15, overlapThreshold=0.5)

        # Load classifier.
        self.classifier = Classifier()
        self.classifier.classify([test_frame])

        self.logger.info('Done loading models.')

    def run(self, img):
        if img is None:
            raise Exception('Frame is missing in process_frame')

        # Detect
        st = time.time()
        detections = self.detector.Detect(img, overlay="none")
        self.logger.debug(
            f'Detection Time: {(time.time() - st) * 1000} [msec]')

        # Filter detections based on tracking criteria
        for det in detections:
            if det.TrackStatus == -1 and det.TrackID in self.tracks:
                self.finish_track(det)
        detections = [det for det in detections if det.TrackID != -
                      1 and det.TrackStatus == 1]
        if len(detections) == 0:
            self.logger.debug('No detections')
            return False, False

        # Crop images
        st = time.time()
        imgs = []
        for det in detections:
            crop_roi = (int(det.Left), int(det.Top),
                        int(det.Right), int(det.Bottom))
            cropped_img = cudaAllocMapped(
                width=crop_roi[2] - crop_roi[0], height=crop_roi[3] - crop_roi[1], format=img.format)
            cudaCrop(img, cropped_img, crop_roi)
            imgs.append(cropped_img)
        self.logger.debug(
            f'Cropping Time : {(time.time() - st) * 1000} [msec] (detections: {len(detections)})')

        # Classify only non-squirrel images
        st = time.time()
        bird_imgs = [img for det, img in zip(
            detections, imgs) if self.detector.GetClassDesc(det.ClassID) != 'squirrel']
        class_descs = self.classifier.classify(bird_imgs)
        self.logger.debug(
            f'Classification Time : {(time.time() - st) * 1000} [msec] (images: {len(bird_imgs)})')

        # Classification postprocessing and tracks analysis
        class_idx = 0
        detected_bird, detected_squirrel = False, False
        for det, img in zip(detections, imgs):
            class_desc = self.detector.GetClassDesc(det.ClassID)
            if class_desc != 'squirrel':
                class_desc = class_descs[class_idx]
                class_idx += 1
                detected_bird = True
            else:
                detected_squirrel = True

            self.logger.debug(
                f'Track Info: Track ID: {det.TrackID}, Status: {det.TrackStatus}, Frames: {det.TrackFrames}, Lost: {det.TrackLost}')
            self.update_track(det, class_desc)

        return detected_bird, detected_squirrel

    def finish_track(self, det):
        self.tracks[det.TrackID]['end_time'] = round(
            time.time() - self.start_time)

    def update_track(self, det, class_desc):
        if det.TrackID not in self.tracks:
            self.tracks[det.TrackID] = {
                'start_time': round(time.time() - self.start_time),
                'preds': []
            }
        self.tracks[det.TrackID]['preds'].append(class_desc)

    def get_results(self):
        end_time = round(time.time() - self.start_time)
        result = []
        for track in self.tracks.values():
            # Reduce false positives
            if len(track['preds']) < MIN_TRACK_FRAMES:
                continue

            # Find most common prediction for each track
            pred_counts = Counter(track['preds'])
            species_name, count = pred_counts.most_common(1)[0]
            confidence = count / len(track['preds'])

            result.append({
                'species_name': species_name,
                'start_time': track['start_time'],
                'end_time': track['end_time'] if 'end_time' in track else end_time,
                'confidence': confidence
            })

        return result

    def reset(self):
        self.tracks = {}
        self.start_time = time.time()

    def close(self):
        self.logger.info('closing frame processor')
        self.classifier.close()
