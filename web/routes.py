from flask import request
from models import db, BirdFood, Videos, Species
from util import fetch_weather_data


def register_routes(app):
    @app.route('/api/health', methods=['GET'])
    def health():
        return {'status': 'ok'}

    @app.route('/api/weather', methods=['GET'])
    def weather():
        return fetch_weather_data()

    @app.route('/api/upload_video', methods=['POST'])
    def upload_video():
        data = request.json

        # Extract data from JSON request
        video_data = {
            'video_processor_version': data['video_processor_version'],
            'start_time': data['start_time'],
            'end_time': data['end_time'],
            'video_path': data['video_path'],
            'audio_path': data['audio_path'],
            'weather_main': data.get('weather_main'),
            **fetch_weather_data()
        }

        # List of species names detected in the video
        species_names = data.get('species_names', [])
        if not species_names:
            return {'error': 'Missing species'}, 400

        # Fetch all active bird foods from the database
        active_bird_foods = BirdFood.query.filter_by(active=True).all()

        # Create new Video instance
        new_video = Videos(**video_data)

        # Associate species and bird food with the new video
        for species_name in species_names:
            species = Species.query.filter_by(name=species_name).first()
            if not species:
                species = Species(name=species_name)
                db.session.add(species)
            new_video.species.append(species)

        new_video.food.extend(active_bird_foods)

        # Save the new video record
        db.session.add(new_video)
        db.session.commit()

        return {'message': 'Video and associated data inserted successfully.'}, 201
