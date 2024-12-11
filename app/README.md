## Prerequisites

- Raspberry Pi 4B or 5, minimum 4GB of RAM
- Raspberry Pi Camera Module
- USB Microphone
- Raspberry Pi OS Lite (64-bit recommended)

## Quick Start

1. **Clone the repository:**

   ```bash
   git clone https://github.com/AleksandrRogachev94/BirdLense
   cd BirdLense/app
   ```

2. **Run the installation script:**

   ```bash
   chmod +x install.sh
   ./install.sh
   ```

3. **Start the application:**

   ```bash
   # Production mode:
   make build && make start

   # Development mode:
   make build-dev && make start-dev
   ```

In production mode, the app starts up automatically after rebooting. The web interface will be available at `http://birdlense.local`.

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
smart-bird-feeder/
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
