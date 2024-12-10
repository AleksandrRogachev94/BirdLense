import json
from flask import request
from datetime import datetime, timezone
from models import ActivityLog, db, BirdFood, Video, Species, VideoSpecies, SpeciesVisit
from util import weather_fetcher, notify
from services.visit_processor import VisitProcessor


def register_routes(app):
    @app.route('/api/processor/videos', methods=['POST'])
    def create_video():
        data = request.json
        try:
            start_time = datetime.fromisoformat(data.get('start_time'))
            end_time = datetime.fromisoformat(data.get('end_time'))
        except ValueError as e:
            return {'error': f'Invalid datetime format: {e}'}, 400

        # Validate required data
        species_list = data.get('species', [])
        if not species_list:
            return {'error': 'Missing species'}, 400

        try:
            # Create video record
            video = Video(
                processor_version=data['processor_version'],
                start_time=start_time,
                end_time=end_time,
                video_path=data['video_path'],
                spectrogram_path=data['spectrogram_path'],
                **weather_fetcher.fetch()
            )
            db.session.add(video)

            # Add active bird foods
            active_bird_foods = BirdFood.query.filter_by(active=True).all()
            video.food.extend(active_bird_foods)

            # Process all detections
            visit_processor = VisitProcessor(db, app.logger)
            visit_processor.process_detections(video, species_list)

            # Save everything
            db.session.commit()

            return {'message': 'Video and associated data inserted successfully.'}, 201

        except Exception as e:
            db.session.rollback()
            app.logger.error(f'Error processing video: {str(e)}')
            return {'error': 'Failed to process video'}, 500

    @app.route('/api/processor/species/active', methods=['PUT'])
    def set_active_species():
        """Set which species are active based on audio detector's capabilities."""
        active_names = request.json

        # Reset all to inactive
        db.session.query(Species).update({'active': False})

        # Set provided species as active
        for name in active_names:
            species = db.session.query(Species).filter_by(name=name).first()
            if species:
                species.active = True
            else:
                app.logger.warn(f'Unknown active species "{name}"')

        db.session.commit()
        return {"message": "success"}, 200

    @app.route('/api/processor/notify/detections', methods=['POST'])
    def notify_detections_route():
        detection = request.json.get('detection')
        notify(f"{detection} Detected", tags="bird")
        return {'message': f'Successfully received notification of {detection}'}, 200

    @app.route('/api/processor/notify/motion', methods=['POST'])
    def notify_motion_route():
        # notify(f"Motion detected", tags="eyes")
        return {'message': f'Successfully received notification of motion'}, 200

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
