## Quick Start

1. **Clone the repository:**

   ```bash
   sudo apt install git && git clone https://github.com/AleksandrRogachev94/BirdLense
   cd BirdLense/app
   ```

2. **Run the installation script:**

   ```bash
   chmod +x install.sh
   ./install.sh
   ```

   Restart terminal session to apply permission changes before proceeding

3. **Run startup command:**

   ```bash
   make start
   ```

   Once completed, the application automatically starts up and will keep running even after rebooting. Verify that there are no errors by viewing logs with `make logs`. The web interface will be available at `http://birdlense.local`.

## Notifications Setup

The app comes with local ntfy notification server in a docker container, nothing gets shared outside of local network. To receive notifications on your smartphone, follow these steps:

1. **Install the ntfy app on your smartphone:**

- [Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy)
- [iOS](https://apps.apple.com/app/ntfy/id1625396347)

2. **Configure the ntfy app:**

- Open the ntfy app on your smartphone.
- Add a new server with the following details:
  - **Host:** `http://birdlense.local:8081`
  - **Channel:** `birdlense`

For more information, visit the [ntfy website](https://ntfy.sh).

## Development

### Docker Setup

The project uses a multi-container structure:

- `docker-compose.base.yml`: Base configuration
- `docker-compose.dev.yml`: Development overrides
- `docker-compose.prod.yml`: Production settings

### Commands

```bash
# Build development containers
make build-dev

# Start development mode
make start-dev

# Stop containers
make stop-dev
```

### Directory Structure

```
BirdLense/
├── app_config/          # Configuration files
├── data/
│   ├── recordings/     # Video recordings and supporting files
├── processor/          # Video/audio processing
├── web/               # Flask API backend
├── ui/                # React frontend
└── nginx/             # Nginx configuration
```

## System Architecture

```mermaid
flowchart TB
    subgraph Hardware
        CAM[Pi Camera]
        MIC[USB Microphone]
        PIR[PIR Motion Sensor]
    end

    subgraph Docker Containers
        subgraph processor[Processor Container]
            YOLO[YOLOv8 Model]
            BIRDNET[BirdNET Model]
            MOTION[Motion Detection]
        end

        subgraph web[Web Container]
            API[Flask API]
            DB[(SQLite DB)]
        end

        subgraph ui[UI Container]
            REACT[React App]
        end

        NGINX[Nginx Container]
        NTFY[Ntfy Notifications]
    end

    CAM --> processor
    MIC --> processor
    PIR --> processor

    processor -- Video Stream --> NGINX
    processor -- Detections --> web

    API --> DB
    REACT -- HTTP --> NGINX
    NGINX -- Proxy --> web
    NGINX -- Proxy --> processor

    classDef container fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e293b
    classDef hardware fill:#dcfce7,stroke:#16a34a,stroke-width:2px
    classDef subComponent fill:#1e293b,stroke:#94a3b8,color:#ffffff
    class processor,web,ui,NGINX,NTFY container
    class CAM,MIC,PIR hardware,subComponent
    class YOLO,BIRDNET,MOTION,API,DB,REACT subComponent
```

## System Components

### Processor Container

- Handles video capture from Pi Camera
- Processes frames with YOLOv8 for bird detection
- Records audio and processes with BirdNET
- Streams MJPEG video for live view

### Web Container

- Flask API backend
- SQLite database
- Handles data storage and retrieval
- Processes bird visit analytics

### UI Container

- React-based web interface
- Material UI components
- Real-time data updates
- Mobile-friendly design

### Nginx Container

- Reverse proxy
- Serves static files
- Handles routing

### Notification Container

- Local notification service (ntfy)
- Alerts for bird detections

## FAQ

**Q: The system is not recognizing my Raspberry Pi camera. What do I do?**

**A:** Sometimes, Raspberry Pi can be finicky with third-party cameras. You may need to adjust `/boot/firmware/config.txt`. For example, to make a PiCam v2 (imx219) work on Raspberry Pi 5's cam0 slot, set `dtoverlay=imx219,cam0` and `camera_auto_detect=0`.
