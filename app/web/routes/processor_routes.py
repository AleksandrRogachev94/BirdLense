import json
import re
from flask import request
from datetime import datetime, timezone, timedelta
from models import ActivityLog, db, BirdFood, Video, Species, VideoSpecies
from util import fetch_weather_data, get_wikipedia_image_and_description


def register_routes(app):
    @app.route('/api/processor/videos', methods=['POST'])
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
                app.logger.warn(f'Video has unknown species "{species_name}"')
                continue

            # If species image_url or description is missing, fetch from Wikipedia
            if not species.image_url or not species.description:
                # Remove text in parentheses such as gender
                clean_name = re.sub(r'\(.*\)', '', species_name).strip()
                species.image_url, species.description = get_wikipedia_image_and_description(
                    clean_name)

            video_species = VideoSpecies(
                species_id=species.id,
                start_time=start_time,
                end_time=end_time,
                confidence=confidence,
                source=source,
                spectrogram_path=spectrogram_path,
                # to use it for optimized searching/sorting
                created_at=new_video.start_time + timedelta(seconds=start_time)
            )
            new_video.video_species.append(video_species)

        new_video.food.extend(active_bird_foods)

        # Save the new video record
        db.session.add(new_video)
        db.session.commit()

        return {'message': 'Video and associated data inserted successfully.'}, 201

    @app.route('/api/processor/species/active', methods=['PUT'])
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

        def activate_species_and_ascendants(species_id):
            species = db.session.query(
                Species).filter_by(id=species_id).first()
            if species:
                species.active = True
                # Recursively update all ascendants to active
                if species.parent_id:
                    activate_species_and_ascendants(species.parent_id)

        for name in active_names:
            # Step 2: Find or create the species
            species = db.session.query(Species).filter_by(name=name).first()
            if species:
                # Ensure this species, its descendants, and its ascendants are marked as active
                activate_species_and_descendants(species.id)
                activate_species_and_ascendants(species.id)
            else:
                app.logger.warn(f'Unknown active species "{name}"')
                # Create the species if it does not exist
                # species = Species(name=name, active=True)
                # db.session.add(species)

        # Commit all changes at the end
        db.session.commit()

        return {"message": "success"}, 200

    @app.route('/api/processor/notify', methods=['POST'])
    def notify():
        detection = request.json.get('detection')
        return {'message': f'Successfully received notification of {detection}'}, 200

    @app.route('/api/processor/activity_log', methods=['POST'])
    def add_or_update_activity_log():
        # Get the incoming JSON data
        data = request.json
        activity_type = data.get('type')
        activity_data = json.dumps(data.get('data'))
        activity_id = data.get('id')

        # Validate required fields
        if not activity_type or activity_data is None:
            return {'error': 'Both "type" and "data" are required'}, 400

        # If no id is provided, create a new ActivityLog
        if activity_id is None:
            new_log = ActivityLog(type=activity_type, data=activity_data)
            db.session.add(new_log)
            db.session.commit()
            return {'message': 'Activity log created successfully', 'id': new_log.id}, 201
        # If id is provided, update the existing ActivityLog
        else:
            log = ActivityLog.query.get(activity_id)
            if not log:
                return {'error': 'Activity log with this ID not found'}, 404
            log.type = activity_type
            log.data = activity_data
            log.updated_at = datetime.now(timezone.utc)
            db.session.commit()
            return {'message': 'Activity log updated successfully', 'id': log.id}, 200
