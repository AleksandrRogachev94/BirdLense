import json
import os
from flask import request, send_from_directory, abort
from sqlalchemy import func, case, distinct
from datetime import datetime, timezone, timedelta
from models import ActivityLog, db, BirdFood, Video, Species, VideoSpecies
from util import fetch_weather_data


def register_routes(app):
    @app.route('/files/data/<path:filename>')
    def serve_file(filename):
        DATA_DIRECTORY = 'data'
        # Secure the filename to avoid directory traversal attacks
        safe_filename = os.path.normpath(filename)
        # Serve the file
        try:
            return send_from_directory(DATA_DIRECTORY, safe_filename)
        except FileNotFoundError:
            abort(404)  # File not found

    @app.route('/api/ui/health', methods=['GET'])
    def health():
        return {'status': 'ok'}

    @app.route('/api/ui/weather', methods=['GET'])
    def weather():
        return fetch_weather_data()

    @app.route('/api/ui/videos/<int:video_id>', methods=['GET'])
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

    @app.route('/api/ui/birdfood', methods=['POST'])
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

    @app.route('/api/ui/birdfood/<int:birdfood_id>/toggle', methods=['PATCH'])
    def toggle_birdfood(birdfood_id):
        bird_food = BirdFood.query.get(birdfood_id)
        if not bird_food:
            return {'error': 'Bird food not found'}, 404

        bird_food.active = not bird_food.active
        db.session.commit()

        return {'message': 'Bird food active status toggled successfully'}, 200

    @app.route('/api/ui/birdfood', methods=['GET'])
    def get_birdfood():
        bird_food = BirdFood.query.all()
        bird_food_list = [{
            'id': food.id,
            'name': food.name,
            'active': food.active
        } for food in bird_food]

        return bird_food_list, 200

    @app.route('/api/ui/overview', methods=['GET'])
    def get_overview():
        # Get the current date and time
        now = datetime.now()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # Query to get top species with hourly detections
        top_species_query = db.session.query(
            Species.id,
            Species.name,
            # Generate hourly counts using SQLite's strftime function to extract the hour
            *[
                func.count(
                    case(
                        (func.strftime('%H', VideoSpecies.created_at)
                         == str(hour).zfill(2), 1),  # condition
                        else_=None  # default for non-matching cases
                    )
                ).label(f'detection_hour_{hour}')
                for hour in range(24)
            ]
        ).join(VideoSpecies, VideoSpecies.species_id == Species.id) \
            .group_by(Species.id) \
            .order_by(func.count(VideoSpecies.id).desc()) \
            .limit(10)  # Limit to top 10 species

        # Format the top species data
        top_species = []
        for species in top_species_query:
            species_data = {
                'id': species.id,
                'name': species.name,
                'detections': [getattr(species, f'detection_hour_{hour}', 0) for hour in range(24)]
            }
            top_species.append(species_data)

        # Query to get overall statistics
        stats_query = db.session.query(
            func.count(distinct(Species.id)).label('uniqueSpecies'),
            func.count(VideoSpecies.id).label('totalDetections'),
            func.sum(
                case(
                    (VideoSpecies.created_at >= start_of_day, 1),
                    else_=0
                )
            ).label('lastHourDetections'),
            func.sum(
                case(
                    (VideoSpecies.source == 'video', 1),
                    else_=0
                )
            ).label('videoDetections'),
            func.sum(
                case(
                    (VideoSpecies.source == 'audio', 1),
                    else_=0
                )
            ).label('audioDetections'),
            func.strftime('%H', func.max(VideoSpecies.created_at)
                          ).label('busiestHour')
        ).join(VideoSpecies, VideoSpecies.species_id == Species.id).first()

        # Format stats data
        stats = {
            'uniqueSpecies': stats_query.uniqueSpecies if stats_query.uniqueSpecies else 0,
            'totalDetections': stats_query.totalDetections if stats_query.totalDetections else 0,
            'lastHourDetections': stats_query.lastHourDetections if stats_query.lastHourDetections else 0,
            'videoDetections': stats_query.videoDetections if stats_query.videoDetections else 0,
            'audioDetections': stats_query.audioDetections if stats_query.audioDetections else 0,
            'busiestHour': int(stats_query.busiestHour) if stats_query.busiestHour else 0
        }

        # Construct the final overview data
        overview_data = {
            'topSpecies': top_species,
            'stats': stats
        }

        return overview_data, 200

    @app.route('/api/ui/timeline', methods=['GET'])
    def get_video_species():
        # Parse query parameters
        start_time = request.args.get('start_time')
        end_time = request.args.get('end_time')

        # Validate query parameters
        if not start_time or not end_time:
            return {'error': 'Both start_time and end_time are required'}, 400

        try:
            start_time = datetime.fromtimestamp(int(start_time))
            end_time = datetime.fromtimestamp(int(end_time))
        except ValueError:
            return {'error': 'Invalid datetime format. Use ISO 8601 format (e.g., YYYY-MM-DDTHH:MM:SS)'}, 400

        # Ensure the interval is no more than 1 day
        if end_time - start_time > timedelta(days=1):
            return {'error': 'The interval between start_time and end_time must not exceed 1 day'}, 400

        # Query VideoSpecies records within the interval and order by created_at desc
        video_species_records = (
            db.session.query(VideoSpecies)
            .join(Video)
            .join(Species)
            .outerjoin(BirdFood, Video.food)
            .filter(VideoSpecies.created_at >= start_time, VideoSpecies.created_at <= end_time)
            .order_by(VideoSpecies.created_at.desc())
            .all()
        )

        # Construct the desired response
        response = []
        for record in video_species_records:
            video_start_time = record.video.start_time
            response.append({
                'id': record.id,
                'video_id': record.video_id,
                'start_time': (video_start_time + timedelta(seconds=record.start_time)).isoformat(),
                'end_time': (video_start_time + timedelta(seconds=record.end_time)).isoformat(),
                'confidence': record.confidence,
                'source': record.source,
                'weather': {
                    'temp': record.video.weather_temp,
                    'clouds': record.video.weather_clouds,
                },
                'species': {
                    'id': record.species.id,
                    'name': record.species.name,
                    'image_url': record.species.photo,
                },
                'food': [
                    {
                        'id': food.id,
                        'name': food.name,
                    } for food in record.video.food
                ]
            })

        return response

    @app.route('/api/ui/species', methods=['GET'])
    def get_all_species():
        # Parse the 'active' query parameter
        active = request.args.get('active')

        # Build query
        query = db.session.query(Species)
        if active is not None:
            try:
                active_flag = active.lower() in ['true', '1']
                query = query.filter(Species.active == active_flag)
            except ValueError:
                return {'error': 'Invalid value for active. Use true or false.'}, 400

        # Execute query and fetch results
        species_list = query.order_by(Species.created_at.desc()).all()

        # Construct the response
        response = [
            {
                'id': species.id,
                'name': species.name,
                'parent_id': species.parent_id,
                'created_at': species.created_at.isoformat(),
                'photo': species.photo,
                'description': species.description,
                'active': species.active
            }
            for species in species_list
        ]

        return response
