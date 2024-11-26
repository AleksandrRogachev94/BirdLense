import json
from flask import request
from sqlalchemy import func, case, distinct
from datetime import datetime, timezone
from models import ActivityLog, db, BirdFood, Video, Species, VideoSpecies
from util import fetch_weather_data


def register_routes(app):
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
            .limit(5)  # Limit to top 5 species

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
            'uniqueSpecies': stats_query.uniqueSpecies,
            'totalDetections': stats_query.totalDetections,
            'lastHourDetections': stats_query.lastHourDetections,
            'videoDetections': stats_query.videoDetections,
            'audioDetections': stats_query.audioDetections,
            'busiestHour': int(stats_query.busiestHour) if stats_query.busiestHour else 0
        }

        # Construct the final overview data
        overview_data = {
            'topSpecies': top_species,
            'stats': stats
        }

        return overview_data, 200
