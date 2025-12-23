#!/bin/bash

# Configuration
REMOTE_USER="alex"
REMOTE_HOST="birdlense" # Or use the IP address
REMOTE_DIR="/home/alex/BirdLense/app/data/recordings"
LOCAL_DEST="./bird_videos"

# Create local directory if it doesn't exist
mkdir -p "$LOCAL_DEST"

echo "Finding videos on remote machine... this may take a moment."

# 1. SSH into the machine
# 2. Find all video.mp4 files
# 3. Shuffle them (shuf) and pick the top 10
# 4. Use rsync to download each file
ssh "$REMOTE_USER@$REMOTE_HOST" "find $REMOTE_DIR -name 'video.mp4' | shuf -n 10" | while read -r remote_path; do
    
    # Create a unique name for each file based on its timestamp path
    # Example: 2025-06-03-094308.mp4
    timestamp_name=$(echo "$remote_path" | awk -F'/' '{print $(NF-3)"-"$(NF-2)"-"$(NF-1)"-"$NF}')
    
    echo "Downloading: $timestamp_name"
    
    scp "$REMOTE_USER@$REMOTE_HOST:$remote_path" "$LOCAL_DEST/$timestamp_name"
done

echo "Done! 10 random videos are in $LOCAL_DEST"