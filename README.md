# Bird Lense

![IMG_4768](https://github.com/user-attachments/assets/1b166d35-d42d-44de-bc27-63c8b1483c1b)

A Raspberry Pi-powered smart bird feeder that uses computer vision and audio recognition to detect, identify, record, and analyze birds. Built with Python, React, and runs entirely on local network using Docker.

## Features

- 🎥 Live video streaming
- 🦜 Real-time bird detection using custom-trained YOLOv8
- 🎤 Bird sound identification using [BirdNET](https://github.com/kahst/BirdNET-Analyzer)
- 📊 Visit tracking and statistics
- 📅 Timeline view of bird activities
- 📱 Modern Material UI mobile-friendly web interface
- 🌡️ Weather integration and analysis
- 🚫 No cloud dependencies, runs completely local
- 🖨️ Custom-designed 3D printing models for the bird feeder

## Prerequisites

- Raspberry Pi 4B or greater with a minimum of 4GB RAM
- High-capacity microSD card (at least 128 GB recommended for ample storage)
- Raspberry Pi Camera Module
- USB Microphone
- [Optional] 3D printer to print the Raspberry Pi enclosure and bird feeder

## Sections

- [Raspberry PI Application](./app)
- [3D Printing](./3d_printing)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [YOLOv8](https://github.com/ultralytics/ultralytics) for object detection base models
- [BirdNET-Analyzer](https://github.com/kahst/BirdNET-Analyzer) for bird sound identification
- [Material-UI](https://mui.com/) for the user interface components
- [OpenWeatherMap](https://openweathermap.org/) for weather integration
