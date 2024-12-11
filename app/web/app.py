import os
from util import notify
from flask import Flask
from flask_cors import CORS
import logging
import routes.ui_routes
import routes.ui_system_routes
import routes.processor_routes
from models import db
from seed.seed import seed

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),  # Logs to the consol
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
    routes.ui_system_routes.register_routes(app)
    routes.processor_routes.register_routes(app)
    notify(f"App is UP!", tags="rocket")
    return app


app = create_app()
