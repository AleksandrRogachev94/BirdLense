from flask import request
from datetime import datetime
from models import db, BirdFood, Videos, Species
from util import fetch_weather_data


def register_routes(app):
    @app.route('/api/health', methods=['GET'])
    def health():
        return {'status': 'ok'}

    @app.route('/api/weather', methods=['GET'])
    def weather():
        return fetch_weather_data()

    @app.route('/api/videos', methods=['POST'])
    def upload_video():
        data = request.json

        # Convert start_time and end_time strings to datetime objects
        start_time_str = data.get('start_time')
        end_time_str = data.get('end_time')

        try:
            start_time = datetime.fromisoformat(start_time_str)
            end_time = datetime.fromisoformat(end_time_str)
        except ValueError as e:
            return {'error': f'Invalid datetime format: {e}'}, 400

        # Extract data from JSON request
        video_data = {
            'video_processor_version': data['video_processor_version'],
            'start_time': start_time,
            'end_time': end_time,
            'video_path': data['video_path'],
            'audio_path': data['audio_path'],
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

    @app.route('/api/birdfood', methods=['POST'])
    def add_birdfood():
        data = request.json
        name = data.get('name')
        if not name:
            return {'error': 'Name is required'}, 400

        bird_food = BirdFood.query.filter_by(name=name).first()
        if bird_food:
            return {'error': 'Bird food with this name already exists'}, 400

        bird_food = BirdFood(name=name, active=data.get('active', True))
        db.session.add(bird_food)
        db.session.commit()

        return {'message': 'Bird food added successfully'}, 201

    @app.route('/api/birdfood/<int:birdfood_id>/toggle', methods=['PATCH'])
    def toggle_birdfood(birdfood_id):
        bird_food = BirdFood.query.get(birdfood_id)
        if not bird_food:
            return {'error': 'Bird food not found'}, 404

        bird_food.active = not bird_food.active
        db.session.commit()

        return {'message': 'Bird food active status toggled successfully'}, 200

    @app.route('/api/birdfood', methods=['GET'])
    def get_birdfood():
        bird_food = BirdFood.query.all()
        bird_food_list = [{
            'id': food.id,
            'name': food.name,
            'active': food.active
        } for food in bird_food]

        return bird_food_list, 200
    
    @app.route('/api/notify', methods=['POST'])
    def notify():
        detection = request.json.get('detection')
        return {'message': f'Successfully received notification of {detection}'}, 200
