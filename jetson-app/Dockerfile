# Use the base image
FROM dustynv/jetson-inference:r32.7.1

# Set the working directory inside the container
WORKDIR /jetson-inference

# Copy your project data and scripts into the container
# COPY ./data /jetson-inference/data

# Expose any necessary ports if required by your application
# EXPOSE <port_number>

# Set any environment variables if needed
# ENV <key>=<value>

# Capture device model information during build
RUN cat /proc/device-tree/model > /tmp/nv_jetson_model

# Specify the command to run when the container starts
CMD ["bash"]