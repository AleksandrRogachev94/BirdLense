#!/usr/bin/env bash

# Change to the expected directory
sudo docker run --runtime nvidia -it --rm \
		--network host \
		-v /tmp/argus_socket:/tmp/argus_socket \
		-v /etc/enctune.conf:/etc/enctune.conf \
		-v /etc/nv_tegra_release:/etc/nv_tegra_release \
		-v /tmp/nv_jetson_model:/tmp/nv_jetson_model \
		-v /var/run/dbus:/var/run/dbus \
		-v /var/run/avahi-daemon/socket:/var/run/avahi-daemon/socket \
		-w $DOCKER_ROOT \
		$DISPLAY_DEVICE $V4L2_DEVICES \
		$DATA_VOLUME $USER_VOLUME $DEV_VOLUME \
		$CONTAINER_IMAGE $USER_COMMAND