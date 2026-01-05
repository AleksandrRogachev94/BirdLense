"""
Merge cleaned NABirds dataset with COCO birds dataset for binary detection.

This script takes the cleaned NABirds YOLO dataset and the COCO birds dataset,
merges them together, and collapses all classes to a single 'bird' class (class 0).

Usage:
    python merge_datasets_binary.py

Inputs expected:
    - nabirds_yolo_cleaned/ (from remove_unused_classes.py)
    - coco_birds_yolo/ (from download_coco_birds.py)

Output:
    - birds_binary_yolo/ (merged dataset with single 'bird' class)
"""

import os
import shutil
import yaml
from pathlib import Path

# Input directories
NABIRDS_DIR = './nabirds_yolo_cleaned'
COCO_BIRDS_DIR = './coco_birds_yolo'

# Output directory
OUTPUT_DIR = './birds_binary_yolo'

# Single class ID for all birds
BIRD_CLASS_ID = 0


def create_output_dirs():
    """Create output directory structure."""
    dirs = [
        os.path.join(OUTPUT_DIR, 'train', 'images'),
        os.path.join(OUTPUT_DIR, 'train', 'labels'),
        os.path.join(OUTPUT_DIR, 'val', 'images'),
        os.path.join(OUTPUT_DIR, 'val', 'labels'),
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)


def process_nabirds_dataset():
    """Process NABirds dataset and copy with class remapping to 0."""
    counts = {'train': 0, 'val': 0}
    
    for split in ['train', 'val']:
        src_images_dir = os.path.join(NABIRDS_DIR, split, 'images')
        src_labels_dir = os.path.join(NABIRDS_DIR, split, 'labels')
        dst_images_dir = os.path.join(OUTPUT_DIR, split, 'images')
        dst_labels_dir = os.path.join(OUTPUT_DIR, split, 'labels')
        
        if not os.path.exists(src_labels_dir):
            print(f"Warning: {src_labels_dir} not found, skipping...")
            continue
        
        for label_file in os.listdir(src_labels_dir):
            if not label_file.endswith('.txt'):
                continue
            
            # Read original labels
            src_label_path = os.path.join(src_labels_dir, label_file)
            with open(src_label_path, 'r') as f:
                lines = f.readlines()
            
            # Remap all classes to 0 (bird)
            new_lines = []
            for line in lines:
                parts = line.strip().split()
                if len(parts) >= 5:
                    # Replace class ID with 0, keep bbox coordinates
                    new_line = f"{BIRD_CLASS_ID} {' '.join(parts[1:])}\n"
                    new_lines.append(new_line)
            
            if not new_lines:
                continue
            
            # Write new label file with nabirds_ prefix to avoid collisions
            new_label_filename = f"nabirds_{label_file}"
            dst_label_path = os.path.join(dst_labels_dir, new_label_filename)
            with open(dst_label_path, 'w') as f:
                f.writelines(new_lines)
            
            # Copy image with prefix
            image_basename = os.path.splitext(label_file)[0]
            for ext in ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']:
                src_image_path = os.path.join(src_images_dir, image_basename + ext)
                if os.path.exists(src_image_path):
                    new_image_filename = f"nabirds_{image_basename}{ext}"
                    dst_image_path = os.path.join(dst_images_dir, new_image_filename)
                    shutil.copy2(src_image_path, dst_image_path)
                    counts[split] += 1
                    break
    
    return counts


def process_coco_dataset():
    """Process COCO birds dataset and copy (already class 0)."""
    counts = {'train': 0, 'val': 0}
    
    for split in ['train', 'val']:
        src_images_dir = os.path.join(COCO_BIRDS_DIR, split, 'images')
        src_labels_dir = os.path.join(COCO_BIRDS_DIR, split, 'labels')
        dst_images_dir = os.path.join(OUTPUT_DIR, split, 'images')
        dst_labels_dir = os.path.join(OUTPUT_DIR, split, 'labels')
        
        if not os.path.exists(src_labels_dir):
            print(f"Warning: {src_labels_dir} not found, skipping...")
            continue
        
        for label_file in os.listdir(src_labels_dir):
            if not label_file.endswith('.txt'):
                continue
            
            # Read labels (should already be class 0)
            src_label_path = os.path.join(src_labels_dir, label_file)
            with open(src_label_path, 'r') as f:
                lines = f.readlines()
            
            if not lines:
                continue
            
            # Copy label file with coco_ prefix
            new_label_filename = f"coco_{label_file}"
            dst_label_path = os.path.join(dst_labels_dir, new_label_filename)
            shutil.copy2(src_label_path, dst_label_path)
            
            # Copy image with prefix
            image_basename = os.path.splitext(label_file)[0]
            for ext in ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']:
                src_image_path = os.path.join(src_images_dir, image_basename + ext)
                if os.path.exists(src_image_path):
                    new_image_filename = f"coco_{image_basename}{ext}"
                    dst_image_path = os.path.join(dst_images_dir, new_image_filename)
                    shutil.copy2(src_image_path, dst_image_path)
                    counts[split] += 1
                    break
    
    return counts


def main():
    print("Creating output directories...")
    create_output_dirs()
    
    print("\nProcessing NABirds dataset...")
    nabirds_counts = process_nabirds_dataset()
    print(f"  Train: {nabirds_counts['train']} images")
    print(f"  Val: {nabirds_counts['val']} images")
    
    print("\nProcessing COCO birds dataset...")
    coco_counts = process_coco_dataset()
    print(f"  Train: {coco_counts['train']} images")
    print(f"  Val: {coco_counts['val']} images")
    
    # Summary
    total_train = nabirds_counts['train'] + coco_counts['train']
    total_val = nabirds_counts['val'] + coco_counts['val']
    
    print(f"\n{'='*50}")
    print(f"Total merged dataset:")
    print(f"  Train: {total_train} images")
    print(f"  Val: {total_val} images")
    print(f"{'='*50}")
    
    # Generate YAML file
    yolo_yaml = {
        'path': os.path.abspath(OUTPUT_DIR),
        'train': 'train/images',
        'val': 'val/images',
        'test': '',
        'names': {0: 'bird'}
    }
    
    yaml_path = os.path.join(OUTPUT_DIR, 'dataset.yaml')
    with open(yaml_path, 'w') as f:
        yaml.dump(yolo_yaml, f, default_flow_style=False)
    
    print(f"\nDataset saved to: {OUTPUT_DIR}")
    print("Merge completed successfully!")


if __name__ == '__main__':
    main()
