import logging
import jetson_utils
from classifier import Classifier

# Configure classifier to log details
logging.basicConfig(level=logging.DEBUG)

img = jetson_utils.loadImage('./data/photos/1.jpg', format="rgb8")
try:
    classifier = Classifier()
    for i in range(10):
        predictions = classifier.classify([img]*(i + 1))
        print(f"Predictions: {predictions}")
finally:
    del img
    classifier.close()
