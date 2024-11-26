from flask import Flask
from flask_cors import CORS
import logging
from logging.handlers import RotatingFileHandler
import routes.ui_routes
import routes.processor_routes
from models import db
from seed.seed import seed

# Configure the root logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),  # Logs to the console
        RotatingFileHandler(
            'app.log',            # Log file name
            maxBytes=5*1024*1024,  # Maximum file size in bytes (e.g., 5 MB)
            backupCount=1         # Number of backup files to keep
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

    return app
