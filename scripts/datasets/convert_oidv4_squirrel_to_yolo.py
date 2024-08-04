import os
import shutil
import cv2
import yaml

# Directories
original_train_dir = './train/Squirrel'
original_val_dir = './validation/Squirrel'
new_dataset_dir = './squirrel_yolo'
os.makedirs(new_dataset_dir, exist_ok=True)

# Create directories for YOLO format
yolo_train_dir = os.path.join(new_dataset_dir, 'train', 'labels')
yolo_val_dir = os.path.join(new_dataset_dir, 'val', 'labels')
os.makedirs(yolo_train_dir, exist_ok=True)
os.makedirs(yolo_val_dir, exist_ok=True)

# Directories for copying images
yolo_train_img_dir = os.path.join(new_dataset_dir, 'train', 'images')
yolo_val_img_dir = os.path.join(new_dataset_dir, 'val', 'images')
os.makedirs(yolo_train_img_dir, exist_ok=True)
os.makedirs(yolo_val_img_dir, exist_ok=True)

# Class index for Squirrel
squirrel_class_index = 1011

# Function to process a directory
def process_directory(original_dir, yolo_label_dir, yolo_img_dir):
    label_dir = os.path.join(original_dir, 'Label')
    for file_name in os.listdir(label_dir):
        if file_name.endswith('.txt'):
            # Read bounding box coordinates
            with open(os.path.join(label_dir, file_name), 'r') as f:
                content = f.readline().strip().split()
                class_name = content[0]
                left, top, right, bottom = map(float, content[1:])

                # Load image to get its size
                image_file_name = file_name.replace('.txt', '.jpg')
                image_path = os.path.join(original_dir, image_file_name)
                if not os.path.exists(image_path):
                    image_file_name = file_name.replace('.txt', '.png')
                    image_path = os.path.join(original_dir, image_file_name)
                
                if not os.path.exists(image_path):
                    print(f"Image not found for {file_name}, skipping...")
                    continue

                # Get image size using OpenCV
                image = cv2.imread(image_path)
                if image is None:
                    print(f"Failed to read image {image_path}, skipping...")
                    continue
                image_height, image_width = image.shape[:2]

                # Calculate YOLO format coordinates
                x_center = (left + right) / 2 / image_width
                y_center = (top + bottom) / 2 / image_height
                box_width = (right - left) / image_width
                box_height = (bottom - top) / image_height

                # Write YOLO label file
                yolo_label_path = os.path.join(yolo_label_dir, file_name)
                with open(yolo_label_path, 'w') as yolo_label_file:
                    yolo_label_file.write(f'{squirrel_class_index} {x_center} {y_center} {box_width} {box_height}\n')

                # Copy image to YOLO images directory
                new_image_path = os.path.join(yolo_img_dir, image_file_name)
                shutil.copyfile(image_path, new_image_path)
                print(f"Processed {image_file_name} and {file_name}")

# Process train and validation directories
process_directory(original_train_dir, yolo_train_dir, yolo_train_img_dir)
process_directory(original_val_dir, yolo_val_dir, yolo_val_img_dir)

# Generate YAML file
yolo_yaml = {
    'path': new_dataset_dir,
    'train': 'train/images',
    'val': 'val/images',
    'test': '',  # You can add test set if available
    'names': {squirrel_class_index: 'Squirrel'}
}

yaml_path = os.path.join(new_dataset_dir, 'dataset.yaml')
with open(yaml_path, 'w') as yaml_file:
    yaml.dump(yolo_yaml, yaml_file, default_flow_style=False)

print("Conversion to YOLO format completed in the new dataset directory.")
