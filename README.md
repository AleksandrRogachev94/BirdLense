# Bird Lense

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
