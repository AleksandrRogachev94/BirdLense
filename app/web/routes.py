from flask import request
from datetime import datetime
from models import db, BirdFood, Video, Species, VideoSpecies
from util import fetch_weather_data


def register_routes(app):
    @app.route('/api/health', methods=['GET'])
    def health():
        return {'status': 'ok'}

    @app.route('/api/weather', methods=['GET'])
    def weather():
        return fetch_weather_data()

    @app.route('/api/videos', methods=['POST'])
    def create_video():
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
            'processor_version': data['processor_version'],
            'start_time': start_time,
            'end_time': end_time,
            'video_path': data['video_path'],
            'audio_path': data['audio_path'],
            **fetch_weather_data()
        }

        # List of species detected in the video
        species_list = data.get('species', [])
        if not species_list:
            return {'error': 'Missing species'}, 400

        # Fetch all active bird foods from the database
        active_bird_foods = BirdFood.query.filter_by(active=True).all()

        # Create new Video instance
        new_video = Video(**video_data)

        # Associate species and bird food with the new video
        for sp in species_list:
            species_name = sp['species_name']
            start_time = sp['start_time']
            end_time = sp['end_time']
            confidence = sp['confidence']
            source = sp['source']
            spectrogram_path = sp.get('spectrogram_path')
            if species_name is None or start_time is None or end_time is None or confidence is None or source is None:
                return {'error': 'Invalid species data'}, 400

            species = Species.query.filter_by(name=species_name).first()
            if not species:
                return {'error': f'Unknown species "{species_name}"'}, 400

            video_species = VideoSpecies(
                species_id=species.id,
                start_time=start_time,
                end_time=end_time,
                confidence=confidence,
                source=source,
                spectrogram_path=spectrogram_path
            )
            new_video.video_species.append(video_species)

        new_video.food.extend(active_bird_foods)

        # Save the new video record
        db.session.add(new_video)
        db.session.commit()

        return {'message': 'Video and associated data inserted successfully.'}, 201

    @app.route('/api/species/active', methods=['PUT'])
    def set_active_species():
        active_names = request.json

        # Step 1: Mark all species as inactive
        db.session.query(Species).update({'active': False})

        def activate_species_and_descendants(species_id):
            species = db.session.query(
                Species).filter_by(id=species_id).first()
            if species:
                species.active = True
                # Recursively update all descendants to active
                children = db.session.query(Species).filter_by(
                    parent_id=species_id).all()
                for child in children:
                    activate_species_and_descendants(child.id)

        for name in active_names:
            # Step 2: Find or create the species
            species = db.session.query(Species).filter_by(name=name).first()
            if not species:
                # Create the species if it does not exist.
                species = Species(name=name, active=True)
                db.session.add(species)
            else:
                # Ensure this species and its descendants are marked as active
                activate_species_and_descendants(species.id)

        # Commit all changes at the end
        db.session.commit()

        return {"message": "success"}, 200

    @app.route('/api/videos/<int:video_id>', methods=['GET'])
    def get_video_details(video_id):
        # Fetch the video from the database
        video = Video.query.get(video_id)

        if not video:
            return {'error': 'Video not found'}, 404

        video_json = {
            'id': video.id,
            'created_at': video.created_at.isoformat(),
            'processor_version': video.processor_version,
            'start_time': video.start_time.isoformat(),
            'end_time': video.end_time.isoformat(),
            'video_path': video.video_path,
            'audio_path': video.audio_path,
            'favorite': video.favorite,
            'weather': {
                'main': video.weather_main,
                'description': video.weather_description,
                'temp': video.weather_temp,
                'humidity': video.weather_humidity,
                'pressure': video.weather_pressure,
                'clouds': video.weather_clouds,
                'wind_speed': video.weather_wind_speed
            },
            'species': [
                {
                    'species_id': vs.species.id,
                    'species_name': vs.species.name,
                    'start_time': vs.start_time,
                    'end_time': vs.end_time,
                    'confidence': vs.confidence,
                    'source': vs.source
                } for vs in video.video_species
            ],
            'food': [
                {
                    'id': bf.id,
                    'name': bf.name
                } for bf in video.food
            ]
        }
        return video_json, 200

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