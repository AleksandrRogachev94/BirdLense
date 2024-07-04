#!/usr/bin/env bash

# Change to the expected directory
cd ~/Documents/jetson-inference

docker/run.sh -v ~/Documents/experiment:/jetson-inference/app --run python3 app/main.py
# docker/run.sh -v ~/Documents/experiment:/jetson-inference/app