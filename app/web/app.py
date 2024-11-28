import os
from util import notify
from flask import Flask
from flask_cors import CORS
import logging
from logging.handlers import RotatingFileHandler
import routes.ui_routes
import routes.processor_routes
from models import db
from seed.seed import seed

# Configure the root logger
log_directory = 'data/logs/web'
os.makedirs(log_directory, exist_ok=True)
# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),  # Logs to the console
        RotatingFileHandler(
            f'{log_directory}/app.log',  # Log file path
            # Maximum file size in bytes (e.g., 5 MB)
            maxBytes=5*1024*1024,
            backupCount=1                # Number of backup files to keep
        )
    ]
)


def create_app():
    app = Flask(__name__)
    CORS(app)
    app.config.from_object('config.Config')

    db.init_app(app)
    with app.app_context():
        db.create_all()
        seed()
    routes.ui_routes.register_routes(app)
    routes.processor_routes.register_routes(app)
    notify(f"App is UP!", tags="rocket")
    return app


app = create_app()
