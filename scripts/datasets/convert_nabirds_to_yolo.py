import os
import shutil
import yaml
import random

# Original dataset directory
original_dataset_dir = './nabirds'

# New dataset directory for YOLO format
new_dataset_dir = './nabirds_yolo'
os.makedirs(new_dataset_dir, exist_ok=True)

# Create directories for YOLO format
yolo_train_dir = os.path.join(new_dataset_dir, 'train', 'labels')
yolo_val_dir = os.path.join(new_dataset_dir, 'val', 'labels')
os.makedirs(yolo_train_dir, exist_ok=True)
os.makedirs(yolo_val_dir, exist_ok=True)

# Directory for copying images
yolo_train_img_dir = os.path.join(new_dataset_dir, 'train', 'images')
yolo_val_img_dir = os.path.join(new_dataset_dir, 'val', 'images')
os.makedirs(yolo_train_img_dir, exist_ok=True)
os.makedirs(yolo_val_img_dir, exist_ok=True)

# Read classes from classes.txt
classes_file = os.path.join(original_dataset_dir, 'classes.txt')
class_mapping = {}
with open(classes_file, 'r') as f:
    for line in f:
        parts = line.strip().split(' ')
        class_id = int(parts[0])
        class_name = ' '.join(parts[1:])
        class_mapping[class_id] = class_name

# Read image to label mappings from image_class_labels.txt
image_to_label_file = os.path.join(original_dataset_dir, 'image_class_labels.txt')
image_to_label = {}
with open(image_to_label_file, 'r') as f:
    for line in f:
        parts = line.strip().split(' ')
        image_id = parts[0]
        label_id = int(parts[1])
        image_to_label[image_id] = label_id

# Read bounding boxes from bounding_boxes.txt
bounding_boxes_file = os.path.join(original_dataset_dir, 'bounding_boxes.txt')
image_to_bbox = {}
with open(bounding_boxes_file, 'r') as f:
    for line in f:
        parts = line.strip().split(' ')
        image_id = parts[0]
        x, y, width, height = map(float, parts[1:])
        image_to_bbox[image_id] = (x, y, width, height)

# Read image sizes from sizes.txt
sizes_file = os.path.join(original_dataset_dir, 'sizes.txt')
image_sizes = {}
with open(sizes_file, 'r') as f:
    for line in f:
        parts = line.strip().split(' ')
        image_id = parts[0]
        width = int(parts[1])
        height = int(parts[2])
        image_sizes[image_id] = (width, height)

# Read train/test split from train_test_split.txt
train_test_split_file = os.path.join(original_dataset_dir, 'train_test_split.txt')
train_images = set()
val_images = []
with open(train_test_split_file, 'r') as f:
    for line in f:
        parts = line.strip().split(' ')
        image_id = parts[0]
        is_train = int(parts[1])
        if is_train == 1:
            train_images.add(image_id)
        else:
            val_images.append(image_id)

# Adjust the validation set to be only 1/4 of its original size
random.shuffle(val_images)
quarter_val = len(val_images) // 4
new_val_images = set(val_images[:quarter_val])
val_to_train = set(val_images[quarter_val:])

# Process each image and create YOLO format label files
images_txt_file = os.path.join(original_dataset_dir, 'images.txt')
with open(images_txt_file, 'r') as f:
    for line in f:
        parts = line.strip().split(' ')
        image_id = parts[0]
        image_path = parts[1]

        if image_id not in image_to_label:
            continue

        label_id = image_to_label[image_id]
        if label_id not in class_mapping:
            continue
        class_name = class_mapping[label_id]

        if image_id not in image_to_bbox:
            continue
        x, y, width, height = image_to_bbox[image_id]

        if image_id not in image_sizes:
            continue
        image_width, image_height = image_sizes[image_id]

        # Calculate YOLO format coordinates
        if image_width == 0 or image_height == 0:
            continue  # Skip if invalid size

        if image_id in train_images or image_id in val_to_train:
            yolo_label_dir = yolo_train_dir
            yolo_img_dir = yolo_train_img_dir
        else:
            yolo_label_dir = yolo_val_dir
            yolo_img_dir = yolo_val_img_dir

        # Normalize bounding box coordinates
        x_center = (x + width / 2) / image_width
        y_center = (y + height / 2) / image_height
        box_width = width / image_width
        box_height = height / image_height

        # Write YOLO label file
        image_filename = os.path.basename(image_path)
        label_filename = os.path.splitext(image_filename)[0] + '.txt'
        label_path = os.path.join(yolo_label_dir, label_filename)
        with open(label_path, 'w') as label_file:
            label_file.write(f'{label_id} {x_center} {y_center} {box_width} {box_height}\n')

        # Copy image to YOLO images directory
        original_image_path = os.path.join(original_dataset_dir, 'images', image_path)
        new_image_path = os.path.join(yolo_img_dir, image_filename)
        shutil.copyfile(original_image_path, new_image_path)

# Generate YAML file
yolo_yaml = {
    'path': new_dataset_dir,
    'train': 'train/images',
    'val': 'val/images',
    'test': '',  # You can add test set if available
    'names': class_mapping
}

yaml_path = os.path.join(new_dataset_dir, 'dataset.yaml')
with open(yaml_path, 'w') as yaml_file:
    yaml.dump(yolo_yaml, yaml_file, default_flow_style=False)

print("Conversion to YOLOv8 format completed in the new dataset directory.")
