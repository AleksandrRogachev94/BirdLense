import numpy as np
import logging
import time
import tensorrt as trt
import pycuda.driver as cuda
import pycuda.autoinit # must be imported to automatically initialize pycuda context
import jetson_utils

TRT_LOGGER = trt.Logger(trt.Logger.INFO)
INPUT_SHAPE = (224, 224, 3)
OUTPUT_SIZE = 525

class Classifier:
    """
    Command used to generate trt model:
    /usr/src/tensorrt/bin/trtexec --onnx=model.onnx --shapes=input_1:0:3x224x224x3 --minShapes=input_1:0:1x224x224x3 --maxShapes=input_1:0:5x224x224x3 --optShapes=input_1:0:3x224x224x3 --saveEngine=engine.trt --verbose --explicitBatch --fp16
    """
    def __init__(self, trt_engine = 'models/classification/engine.trt', labels='models/classification/labels.txt', labels_used='models/classification/labels_used.txt', max_batch_size = 5):
        self.logger = logging.getLogger(__name__)
        self.max_batch_size = max_batch_size
        # small optimization to prevent re-allocation of images
        self.images_pool = [jetson_utils.cudaAllocMapped(width=INPUT_SHAPE[0], height=INPUT_SHAPE[1], format="rgb8") for _ in range(self.max_batch_size)]

        with open(labels, 'r') as f:
            self.labels = [line.strip() for line in f]
        with open(labels_used, 'r') as f:
            # Ignore classes not listed in labels_used.
            self.labels_used = [line.strip() for line in f]
            self.labels_not_used_indexes = np.where(~np.isin(self.labels, self.labels_used))[0]
        with open(trt_engine, 'rb') as f, trt.Runtime(TRT_LOGGER) as runtime:
            self.engine = runtime.deserialize_cuda_engine(f.read())
            self.context = self.engine.create_execution_context()

    def preprocess_images(self, imgs):
        # List to hold the preprocessed images
        batch_images = []
        # Allocate memory for each resized image and perform resizing
        for i, img in enumerate(imgs):
            # Resize the image
            jetson_utils.cudaResize(img, self.images_pool[i])
            # Append the resized image to the list
            batch_images.append(self.images_pool[i])
        
        # Synchronize once after all images are resized
        jetson_utils.cudaDeviceSynchronize()

        # Pre-allocate a NumPy array for the batch
        batch_images_np = np.empty((len(batch_images), 224, 224, 3), dtype=np.float32)
        # Convert all images to NumPy arrays and copy directly into the pre-allocated array
        for i, img in enumerate(batch_images):
            batch_images_np[i] = jetson_utils.cudaToNumpy(img).astype(np.float32)
        
        # Convert the batch to CUDA memory
        batch_images_cuda = jetson_utils.cudaFromNumpy(batch_images_np)
        return batch_images_cuda
    
    def _classify(self, imgs):
        batch_size = len(imgs)
        self.context.set_binding_shape(0, (batch_size,) + INPUT_SHAPE)  # Explicitly set the input shape

        # Allocate output buffers
        h_output = np.empty((batch_size, OUTPUT_SIZE), dtype=np.float32)
        d_output = cuda.mem_alloc(h_output.nbytes)

        st = time.time()
        preprocessed_images = self.preprocess_images(imgs)
        preprocessing_time = (time.time() - st) * 1000

        st = time.time()
        self.context.execute(bindings=[int(preprocessed_images.ptr), int(d_output)])
        inference_time = (time.time() - st) * 1000
        

        st = time.time()
        cuda.memcpy_dtoh(h_output, d_output)
        # Zero out classes we are not interested in.
        h_output[:, self.labels_not_used_indexes] = 0
        # Get most probable class
        max_confidence_indexes = np.argmax(h_output, axis=1)
        predictions = [self.labels[index] for index in max_confidence_indexes]
        postprocessing_time = (time.time() - st) * 1000
       
        self.logger.debug('Classifier Total Time: {} [msec] (batch size: {})'.format(preprocessing_time + inference_time + postprocessing_time, batch_size))
        self.logger.debug('Preprocessing: {} [msec]'.format(preprocessing_time))
        self.logger.debug('Inference: {} [msec]'.format(inference_time))
        self.logger.debug('Postprocessing: {} [msec]'.format(postprocessing_time))
        
        return predictions
    
    def classify(self, imgs):
        # Batch imgs based on max_batch_size
        batches = [imgs[i:i + self.max_batch_size] for i in range(0, len(imgs), self.max_batch_size)]
        batch_results = [self._classify(batch) for batch in batches]
        flattened = [result for batch in batch_results for result in batch]
        return flattened


    def close(self):
        # It's important to call this function to set the following properties to None.
        # Otherwise, trt engine outlives pycuda context, and there are deallocation errors at the end.
        self.images_pool = None
        self.context = None
        self.engine = None
    