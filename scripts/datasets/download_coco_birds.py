"""
Download COCO dataset with only the 'bird' class.

This script uses the fiftyone library to download COCO 2017 dataset
filtered to only include images containing birds and converts them
to YOLO format.

Usage:
    pip install fiftyone pycocotools
    python download_coco_birds.py
"""

import os
import shutil
import yaml

try:
    import fiftyone as fo
    import fiftyone.zoo as foz
except ImportError:
    print("Please install fiftyone: pip install fiftyone")
    exit(1)

# Output directory
output_dir = './coco_birds_yolo'
os.makedirs(output_dir, exist_ok=True)

# Create YOLO directory structure
train_images_dir = os.path.join(output_dir, 'train', 'images')
train_labels_dir = os.path.join(output_dir, 'train', 'labels')
val_images_dir = os.path.join(output_dir, 'val', 'images')
val_labels_dir = os.path.join(output_dir, 'val', 'labels')

for d in [train_images_dir, train_labels_dir, val_images_dir, val_labels_dir]:
    os.makedirs(d, exist_ok=True)

# COCO class ID for bird is 14 (0-indexed), we'll map to class 0 for binary
BIRD_CLASS_ID = 0  # Our output class ID


def process_split(split_name, images_dir, labels_dir):
    """Download and process a COCO split for bird class only."""
    print(f"Downloading COCO {split_name} split with bird class...")
    
    # Load COCO dataset with only bird class
    dataset = foz.load_zoo_dataset(
        "coco-2017",
        split=split_name,
        label_types=["detections"],
        classes=["bird"],
        max_samples=None,  # Get all samples
    )
    
    count = 0
    for sample in dataset:
        if sample.ground_truth is None:
            continue
            
        # Filter detections to only birds
        bird_detections = [
            det for det in sample.ground_truth.detections
            if det.label == "bird"
        ]
        
        if not bird_detections:
            continue
        
        # Get image path and copy to output
        src_image_path = sample.filepath
        image_filename = os.path.basename(src_image_path)
        dst_image_path = os.path.join(images_dir, image_filename)
        
        # Copy image
        shutil.copy2(src_image_path, dst_image_path)
        
        # Create YOLO label file
        label_filename = os.path.splitext(image_filename)[0] + '.txt'
        label_path = os.path.join(labels_dir, label_filename)
        
        with open(label_path, 'w') as f:
            for det in bird_detections:
                # COCO bounding box format from fiftyone is [x, y, w, h] normalized
                x, y, w, h = det.bounding_box
                # Convert to YOLO center format
                x_center = x + w / 2
                y_center = y + h / 2
                f.write(f'{BIRD_CLASS_ID} {x_center:.6f} {y_center:.6f} {w:.6f} {h:.6f}\n')
        
        count += 1
        if count % 100 == 0:
            print(f"Processed {count} images...")
    
    # Clean up fiftyone dataset
    fo.delete_dataset(dataset.name)
    
    return count


# Process train and validation splits
train_count = process_split("train", train_images_dir, train_labels_dir)
val_count = process_split("validation", val_images_dir, val_labels_dir)

print(f"\nProcessed {train_count} training images")
print(f"Processed {val_count} validation images")

# Generate YAML file
yolo_yaml = {
    'path': os.path.abspath(output_dir),
    'train': 'train/images',
    'val': 'val/images',
    'test': '',
    'names': {0: 'bird'}
}

yaml_path = os.path.join(output_dir, 'dataset.yaml')
with open(yaml_path, 'w') as f:
    yaml.dump(yolo_yaml, f, default_flow_style=False)

print(f"\nCOCO birds dataset saved to: {output_dir}")
print("Conversion to YOLO format completed.")
