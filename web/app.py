from flask import Flask
from models import db
from routes import register_routes


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
