import argparse
import numpy as np
import tensorrt as trt
import time

import pycuda.driver as cuda
import pycuda.autoinit
import pycuda.gpuarray as gpuarray
from jetson_utils import videoSource, videoOutput, cudaAllocMapped, cudaMemcpy, loadImage, cudaResize
import jetson_utils
import numpy as np
from PIL import Image

# COMMAND
# /usr/src/tensorrt/bin/trtexec --onnx=model2.onnx --shapes=input_1:0:3x224x224x3 --minShapes=input_1:0:1x224x224x3 --maxShapes=input_1:0:5x224x224x3 --optShapes=input_1:0:3x224x224x3 --saveEngine=engine.trt --verbose --explicitBatch --fp16

LOGGER = trt.Logger(trt.Logger.WARNING)
DTYPE = trt.float32

# Model
TRT_ENGINE = './models/engine.trt'
INPUT_SHAPE = (224, 224, 3)

# how many video frames we are going to analyze
LOOP_TIMES = 10

IMAGE_PATH = "./videos/photos/1.jpg"

# Allocate memory for the resized image
alloced_images = [jetson_utils.cudaAllocMapped(width=224, height=224, format="rgb8") for _ in range(3)]

def preprocess_images(imgs):
    # List to hold the preprocessed images
    batch_images = []

    st = time.time()
    # Allocate memory for each resized image and perform resizing
    for i, img in enumerate(imgs):
        
        # Resize the image
        jetson_utils.cudaResize(img, alloced_images[i])
        # Append the resized image to the list
        batch_images.append(alloced_images[i])
        
    resize_time = time.time()
    print('Resize time: {} [msec]'.format((resize_time - st) * 1000))
    
    # Synchronize once after all images are resized
    jetson_utils.cudaDeviceSynchronize()

    sync_time = time.time()
    print('Sync time: {} [msec]'.format((sync_time - resize_time) * 1000))

    # Pre-allocate a NumPy array for the batch
    batch_images_np = np.empty((len(batch_images), 224, 224, 3), dtype=np.float32)
    # Convert all images to NumPy arrays and copy directly into the pre-allocated array
    for i, img in enumerate(batch_images):
        batch_images_np[i] = jetson_utils.cudaToNumpy(img).astype(np.float32)

    np_time = time.time()
    print('NP time: {} [msec]'.format((np_time - sync_time) * 1000))
    
    # Convert the batch to CUDA memory
    batch_images_cuda = jetson_utils.cudaFromNumpy(batch_images_np)

    conv_time = time.time()
    print('Conv time: {} [msec]'.format((conv_time - np_time) * 1000))
    
    return batch_images_cuda

def main():
    batch_size = 3

    TRT_LOGGER = trt.Logger(trt.Logger.INFO)

    img = jetson_utils.loadImage(IMAGE_PATH, format="rgb8")

    with open(TRT_ENGINE, 'rb') as f, trt.Runtime(TRT_LOGGER) as runtime:
        engine = runtime.deserialize_cuda_engine(f.read())
        h_output1 = cuda.pagelocked_empty(trt.volume((batch_size, 1000)), dtype=trt.nptype(DTYPE))
        d_output1 = cuda.mem_alloc(h_output1.nbytes)

    print('-- prepared engine')
   
    with engine.create_execution_context() as context:
        context.set_binding_shape(0, (batch_size,) + INPUT_SHAPE)  # Explicitly set the input shape

        loop_start = time.time()
        for i in range(LOOP_TIMES):
            st = time.time()
            preprocessed_image = preprocess_images([img] * batch_size)
            prep_time = time.time()
            print('Preprocessing time {}: {} [msec]'.format(i, (prep_time - st) * 1000))
            context.execute(bindings=[int(preprocessed_image.ptr), int(d_output1)])
            print('Inference time {}: {} [msec]'.format(i, (time.time() - prep_time) * 1000))
            print('Total inference time {}: {} [msec]'.format(i, (time.time() - st) * 1000))
            print('---', i)

            # Allocate host memory for output and copy from device to host
            cuda.memcpy_dtoh(h_output1, d_output1)
            
            # Process the output
            predictions = np.squeeze(h_output1)  # Remove batch dimension if batch_size > 1
            
            # Get index of max confidence
            max_confidence_index = np.argmax(predictions)
            
            # Get max confidence score
            max_confidence = predictions[max_confidence_index]
            
            print(f"Predicted class index: {max_confidence_index}")
            print(f"Max: {max_confidence}")
            
        print("avg_time: ", (time.time()-loop_start)/LOOP_TIMES)

                
if __name__ == '__main__':
    main()
