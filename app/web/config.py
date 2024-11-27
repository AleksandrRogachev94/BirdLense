import os


class Config:
    db_directory = os.path.join(os.path.abspath(
        os.path.dirname(__file__)), 'data/db')
    os.makedirs(db_directory, exist_ok=True)
    db_path = os.path.join(db_directory, 'smart-bird-feeder.db')
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL', f'sqlite:///{db_path}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
