import os
import cv2
import yaml
import shutil
from pathlib import Path
from tqdm import tqdm

# This script converts a YOLO detection dataset to a classification dataset by cropping images based on the bounding boxes provided in the YOLO format.
# The cropped images are saved in a new directory structure, where each class has its own subdirectory.

# ================= CONFIGURATION =================
# Path to your data.yaml file (contains class names and dataset paths)
YAML_PATH = "/Users/alex/Documents/code/BirdLense/datasets/nabirds_yolo_cleaned/dataset.yaml"

# Where you want the new classification dataset to go
OUTPUT_DIR = "/Users/alex/Documents/code/BirdLense/datasets/nabirds_yolo_cleaned_cls"

# Features to improve model quality
PADDING = 0.10        # Add 10% context around the box
MIN_SIZE = 40         # Ignore crops smaller than 40x40 pixels
# =================================================

def create_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def load_yaml_config(yaml_path):
    """Load dataset configuration from YAML file and resolve relative paths."""
    if not os.path.exists(yaml_path):
        print(f"Error: data.yaml not found at {yaml_path}")
        return None, None, {}
    
    yaml_dir = Path(yaml_path).parent
    
    with open(yaml_path, 'r') as f:
        data = yaml.safe_load(f)
    
    # Resolve the base path relative to YAML file location
    base_path = data.get('path', '.')
    if not os.path.isabs(base_path):
        base_path = (yaml_dir / base_path).resolve()
    else:
        base_path = Path(base_path)
    
    # Get split paths from YAML
    splits_config = {
        'train': data.get('train', 'train/images'),
        'val': data.get('val', 'val/images'),
        'test': data.get('test', 'test/images')
    }
    
    class_names = data.get('names', {})
    
    return base_path, splits_config, class_names

def convert_coordinates(x_center, y_center, width, height, img_w, img_h, padding):
    # Convert normalized YOLO (0-1) to pixels
    w_pixel = width * img_w
    h_pixel = height * img_h
    x_center_pixel = x_center * img_w
    y_center_pixel = y_center * img_h

    # Calculate corners
    x1 = int(x_center_pixel - (w_pixel / 2))
    y1 = int(y_center_pixel - (h_pixel / 2))
    x2 = int(x_center_pixel + (w_pixel / 2))
    y2 = int(y_center_pixel + (h_pixel / 2))

    # Apply Padding
    pad_w = int(w_pixel * padding)
    pad_h = int(h_pixel * padding)

    x1 = max(0, x1 - pad_w)
    y1 = max(0, y1 - pad_h)
    x2 = min(img_w, x2 + pad_w)
    y2 = min(img_h, y2 + pad_h)

    return x1, y1, x2, y2

def process_dataset():
    base_path, splits_config, class_names = load_yaml_config(YAML_PATH)
    
    if base_path is None:
        print("Failed to load dataset configuration. Exiting.")
        return
    
    print(f"Dataset base path: {base_path}")

    for split in ['train', 'val', 'test']:
        # Get the split path from YAML config
        split_img_path = splits_config.get(split, '')
        
        # Skip empty splits (like test: "")
        if not split_img_path:
            print(f"Skipping split '{split}' (not configured in YAML)")
            continue
        
        # Resolve the full image directory path
        img_dir = base_path / split_img_path
        
        # Derive labels path by replacing 'images' with 'labels' in the path
        lbl_dir = Path(str(img_dir).replace('/images', '/labels'))
        
        if not img_dir.exists():
            print(f"Skipping split '{split}' (directory not found: {img_dir})")
            continue

        print(f"Processing {split}...")
        print(f"  Images: {img_dir}")
        print(f"  Labels: {lbl_dir}")

        
        # Get list of images
        image_files = list(img_dir.glob('*.jpg')) + list(img_dir.glob('*.png')) + list(img_dir.glob('*.jpeg'))
        
        for img_path in tqdm(image_files):
            # Load Image
            img = cv2.imread(str(img_path))
            if img is None:
                continue
            h_img, w_img, _ = img.shape

            # Find corresponding label file
            label_name = img_path.stem + ".txt"
            label_path = lbl_dir / label_name

            if not label_path.exists():
                continue

            # Process labels
            with open(label_path, 'r') as f:
                lines = f.readlines()

            for i, line in enumerate(lines):
                parts = line.strip().split()
                if len(parts) < 5: 
                    continue
                
                class_id = int(parts[0])
                # Get class name or use ID if yaml missing
                if class_names and (class_id in class_names or str(class_id) in class_names):
                    class_name = class_names[class_id]
                else:
                    class_name = str(class_id)
                
                # Sanitize class name for folder paths (remove spaces/special chars)
                class_name = str(class_name).replace(" ", "_").replace("/", "_OR_")

                # Parse coordinates
                nx, ny, nw, nh = map(float, parts[1:5])
                
                # Convert to pixels and crop
                x1, y1, x2, y2 = convert_coordinates(nx, ny, nw, nh, w_img, h_img, PADDING)
                
                # Check minimum size
                if (x2 - x1) < MIN_SIZE or (y2 - y1) < MIN_SIZE:
                    continue

                crop = img[y1:y2, x1:x2]

                # Prepare output directory
                save_dir = Path(OUTPUT_DIR) / split / class_name
                create_dir(save_dir)

                # Save file: {original_filename}_crop_{index}.jpg
                save_name = f"{img_path.stem}_crop_{i}.jpg"
                cv2.imwrite(str(save_dir / save_name), crop)

    print(f"\nConversion Complete! Dataset saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    process_dataset()