import os
import shutil
import yaml
from collections import defaultdict

# Paths
hierarchy_path = 'nabirds/hierarchy.txt'
dataset_config_path = 'nabirds_yolo/dataset.yaml'
train_images_dir = 'nabirds_yolo/train/images'
train_labels_dir = 'nabirds_yolo/train/labels'
val_images_dir = 'nabirds_yolo/val/images'
val_labels_dir = 'nabirds_yolo/val/labels'
new_dataset_path = 'nabirds_yolo_cleaned'

# Load dataset.yaml
with open(dataset_config_path, 'r') as file:
    dataset_config = yaml.safe_load(file)

# Load hierarchy.txt
hierarchy = {}
with open(hierarchy_path, 'r') as file:
    for line in file:
        child, parent = line.strip().split()
        hierarchy[int(child)] = int(parent)

# Create new directories for the new dataset
os.makedirs(os.path.join(new_dataset_path, 'train/images'), exist_ok=True)
os.makedirs(os.path.join(new_dataset_path, 'train/labels'), exist_ok=True)
os.makedirs(os.path.join(new_dataset_path, 'val/images'), exist_ok=True)
os.makedirs(os.path.join(new_dataset_path, 'val/labels'), exist_ok=True)

# Collect valid class IDs (classes with samples)
valid_classes = defaultdict(int)

def process_split(images_dir, labels_dir):
    for label_file in os.listdir(labels_dir):
        with open(os.path.join(labels_dir, label_file), 'r') as file:
            labels = file.readlines()

        for label in labels:
            class_id = int(label.split()[0])
            valid_classes[class_id] += 1

process_split(train_images_dir, train_labels_dir)
process_split(val_images_dir, val_labels_dir)

# Filter out classes without samples
valid_classes = {k: v for k, v in valid_classes.items() if v > 0}

# Create a mapping from old class IDs to new class IDs
old_to_new_class_id = {old_id: new_id for new_id, old_id in enumerate(valid_classes.keys())}

# Create new dataset structure and update labels
def process_images_and_labels(split_images_dir, split_labels_dir, new_split_images_dir, new_split_labels_dir):
    for label_file in os.listdir(split_labels_dir):
        image_id = label_file.split('.')[0]
        image_file = f'{image_id}.jpg'

        with open(os.path.join(split_labels_dir, label_file), 'r') as file:
            labels = file.readlines()

        new_labels = []
        for label in labels:
            class_id = int(label.split()[0])
            if class_id in old_to_new_class_id:
                new_class_id = old_to_new_class_id[class_id]
                new_label = f'{new_class_id}' + label[len(str(class_id)):]
                new_labels.append(new_label)

        if new_labels:
            with open(os.path.join(new_split_labels_dir, label_file), 'w') as file:
                file.writelines(new_labels)
            shutil.copy(os.path.join(split_images_dir, image_file), os.path.join(new_split_images_dir, image_file))

process_images_and_labels(train_images_dir, train_labels_dir, os.path.join(new_dataset_path, 'train/images'), os.path.join(new_dataset_path, 'train/labels'))
process_images_and_labels(val_images_dir, val_labels_dir, os.path.join(new_dataset_path, 'val/images'), os.path.join(new_dataset_path, 'val/labels'))

# Update dataset.yaml
new_names = {new_id: dataset_config['names'][old_id] for old_id, new_id in old_to_new_class_id.items()}
new_dataset_config = {
    'names': new_names,
    'path': new_dataset_path,
    'test': '',
    'train': 'train/images',
    'val': 'val/images'
}

with open(os.path.join(new_dataset_path, 'dataset.yaml'), 'w') as file:
    yaml.dump(new_dataset_config, file)

print("New dataset created successfully.")
