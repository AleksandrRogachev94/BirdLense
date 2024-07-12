from routes import register_routes
from models import db
from flask import Flask
import logging
from logging.handlers import RotatingFileHandler

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
    app.config.from_object('config.Config')

    db.init_app(app)
    with app.app_context():
        db.create_all()

    register_routes(app)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
