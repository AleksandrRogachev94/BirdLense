# Birds Detection Dataset Scripts

[NABirds](https://dl.allaboutbirds.org/nabirds) was used as the base dataset for object detection model training. This folder contain various scripts to convert it to YOLO format, clean it up for better training results, and augment it with additional classes such "squirrel". I added these files in the repo for future reference in case I need to further improve the model.

## convert_nabirds_yolo.py

This script converts raw NABirds dataset to [Ultalytics YOLO format](https://docs.ultralytics.com/datasets/) used for training.

## remove_unused_classes.py

This script changes the result of convert_nabirds_yolo.py script to remove all classes that are not present in the dataset. It was needed because the classes used in NABirds dataset are hierarhical, and only the lowest nodes in the hierarhical have actual images. It improves model performance and reduces computations.

## convert_nabirds_yolo_reduced.py

This script is similar to convert_nabirds_yolo.py, but it groups gender specific classes into a single classes based on the hierarchy leading to fewer classes. The intent was to minimize the number of classes and make model training simpler leading to better results. In practice, the performance was not significantly better, around 2 percents MAP50-95 score improvement, so this dataset is not actively used.

## build_name_hierarchy.py

Simple script to convert NABirds' hierarchy.txt file from child_id:parent_id format to child_name:parent_name format. The result is used in the raspberry pi app.

## convert_oidv4_to_yolo

This script is used to convert the OIDv4 dataset with just one 1 extracted class, squirrel, to Ultralytics YOLO format. The squirrel class was extracted using [OIDv4 Toolkit](https://github.com/EscVM/OIDv4_ToolKit). The result was then manually merged with the NABirds YOLO dataset to get the final result used for training
