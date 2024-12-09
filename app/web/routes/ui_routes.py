from flask import request
from sqlalchemy import func, case, distinct, or_
from sqlalchemy.orm import aliased
from datetime import datetime, timezone, timedelta
from models import ActivityLog, db, BirdFood, Video, Species, VideoSpecies, video_bird_food_association
from util import weather_fetcher, update_species_info_from_wiki
from app_config.app_config import app_config
import re
import psutil


def register_routes(app):
    @app.route('/api/ui/health', methods=['GET'])
    def health():
        return {'status': 'ok'}

    @app.route('/api/ui/weather', methods=['GET'])
    def weather():
        weather = weather_fetcher.fetch()
        return {
            'main': weather.get('weather_main'),
            'description': weather.get('weather_description'),
            'temp': weather.get('weather_temp'),
            'humidity': weather.get('weather_humidity'),
            'pressure': weather.get('weather_pressure'),
            'clouds': weather.get('weather_clouds'),
            'wind_speed': weather.get('weather_wind_speed'),
        }

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
            'spectrogram_path': video.spectrogram_path,
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
                    'source': vs.source,
                    'image_url': vs.species.image_url,
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
        bird_food = BirdFood.query.order_by(
            BirdFood.active.desc(), BirdFood.created_at.asc()).all()
        bird_food_list = [{
            'id': food.id,
            'name': food.name,
            'active': food.active
        } for food in bird_food]

        return bird_food_list, 200

    @app.route('/api/ui/overview', methods=['GET'])
    def get_overview():
        # Parse the date from query parameters
        date_param = request.args.get('date', None)
        try:
            # If a date is provided, parse it; otherwise, use the current date
            if date_param:
                date = datetime.strptime(date_param, '%Y-%m-%d')
            else:
                date = datetime.now()
        except ValueError:
            return {"error": "Invalid date format. Use YYYY-MM-DD."}, 400

        # Set the start and end of the day for the given date
        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = date.replace(
            hour=23, minute=59, second=59, microsecond=999999)

        # Subquery to get active species and their direct child species
        ParentSpecies = aliased(Species)  # Alias for self-join
        active_species_subq = db.session.query(
            Species.id,
            Species.name,
            case(
                (Species.active == True, Species.id),
                else_=Species.parent_id
            ).label('group_id')
        ).outerjoin(
            ParentSpecies,
            Species.parent_id == ParentSpecies.id
        ).filter(
            or_(
                Species.active == True,  # Active species
                ParentSpecies.active == True  # Parent species is active
            )
        ).subquery()

        # Query to get top species with hourly detections for the given day
        top_species_query = db.session.query(
            active_species_subq.c.group_id.label('id'),
            Species.name.label('name'),  # Get the parent species name
            *[
                func.sum(
                    case(
                        (func.strftime('%H', VideoSpecies.created_at)
                         == str(hour).zfill(2), 1),
                        else_=0
                    )
                ).label(f'detection_hour_{hour}')
                for hour in range(24)
            ]
        ).join(
            Species, Species.id == active_species_subq.c.group_id
        ).join(
            VideoSpecies, VideoSpecies.species_id == active_species_subq.c.id
        ).filter(
            VideoSpecies.created_at >= start_of_day,
            VideoSpecies.created_at <= end_of_day
        ).group_by(
            active_species_subq.c.group_id
        ).order_by(
            func.sum(case((VideoSpecies.id.isnot(None), 1), else_=0)).desc()
        ).limit(10)

        # Format the top species data
        top_species = []
        for species in top_species_query:
            species_data = {
                'id': species.id,
                'name': species.name,
                'detections': [getattr(species, f'detection_hour_{hour}', 0) or 0 for hour in range(24)]
            }
            top_species.append(species_data)

        # Query to get overall statistics for the given day, considering active species grouping
        stats_query = db.session.query(
            func.count(distinct(active_species_subq.c.group_id)
                       ).label('uniqueSpecies'),
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
        ).join(
            active_species_subq, VideoSpecies.species_id == active_species_subq.c.id
        ).filter(
            VideoSpecies.created_at >= start_of_day,
            VideoSpecies.created_at <= end_of_day
        ).first()

        # Format stats data
        stats = {
            'uniqueSpecies': stats_query.uniqueSpecies if stats_query.uniqueSpecies else 0,
            'totalDetections': stats_query.totalDetections if stats_query.totalDetections else 0,
            'lastHourDetections': stats_query.lastHourDetections if stats_query.lastHourDetections else 0,
            'videoDetections': stats_query.videoDetections if stats_query.videoDetections else 0,
            'audioDetections': stats_query.audioDetections if stats_query.audioDetections else 0,
            'busiestHour': int(stats_query.busiestHour) if stats_query.busiestHour else 0
        }

        return {
            'topSpecies': top_species,
            'stats': stats
        }, 200

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
                'start_time': (video_start_time + timedelta(seconds=record.start_time)).astimezone(timezone.utc).isoformat(),
                'end_time': (video_start_time + timedelta(seconds=record.end_time)).astimezone(timezone.utc).isoformat(),
                'confidence': record.confidence,
                'source': record.source,
                'weather': {
                    'temp': record.video.weather_temp,
                    'clouds': record.video.weather_clouds,
                },
                'species': {
                    'id': record.species.id,
                    'name': record.species.name,
                    'image_url': record.species.image_url,
                    'parent_id': record.species.parent_id,
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
        # Build base query
        query = db.session.query(
            Species,
            func.count(VideoSpecies.id).label('count')
        ).outerjoin(VideoSpecies)

        # Group by species and order by name
        species_list = query.group_by(
            Species.id).order_by(Species.name.asc()).all()

        # Construct the response
        return [
            {
                'id': species.Species.id,
                'name': species.Species.name,
                'parent_id': species.Species.parent_id,
                'created_at': species.Species.created_at.isoformat(),
                'image_url': species.Species.image_url,
                'description': species.Species.description,
                'active': species.Species.active,
                'count': species.count
            }
            for species in species_list
        ]

    @app.route('/api/ui/settings', methods=['GET'])
    def get_settings():
        return app_config.config, 200

    @app.route('/api/ui/settings', methods=['PATCH'])
    def update_settings():
        try:
            # Parse JSON body from the request
            updates = request.json
            if not updates:
                return {"error": "No data provided for update"}, 400

            # Recursively merge the updates into the current configuration
            app_config.config = app_config.merge_dicts(
                app_config.config, updates)

            # Save the updated configuration back to the user config file
            app_config.save()

            # Return the updated configuration
            return app_config.config

        except Exception as e:
            return {"error": str(e)}, 500

    @app.route('/api/ui/species/<int:species_id>/summary', methods=['GET'])
    def get_species_summary(species_id):
        # Get the species and its direct children
        species = Species.query.get(species_id)
        if not species:
            return {'error': 'Species not found'}, 404

        children = Species.query.filter_by(parent_id=species_id).all()
        all_species_ids = [species.id] + [child.id for child in children]

        if update_species_info_from_wiki(species):
            db.session.add(species)
            db.session.commit()

        # Calculate date ranges
        now = datetime.now(timezone.utc)
        last_24h = now - timedelta(days=1)
        last_7d = now - timedelta(days=7)
        last_30d = now - timedelta(days=30)

        # Function to get stats with species breakdown
        def get_detection_stats(since_time):
            return db.session.query(
                VideoSpecies.species_id,
                func.count().label('count')
            ).filter(
                VideoSpecies.species_id.in_(all_species_ids),
                VideoSpecies.created_at >= since_time
            ).group_by(
                VideoSpecies.species_id
            ).all()

        # Get aggregated stats with species breakdown
        stats_24h = dict(get_detection_stats(last_24h))
        stats_7d = dict(get_detection_stats(last_7d))
        stats_30d = dict(get_detection_stats(last_30d))

        # Get first and last sighting dates across all species
        sightings = db.session.query(
            func.min(VideoSpecies.created_at).label('first'),
            func.max(VideoSpecies.created_at).label('last')
        ).filter(
            VideoSpecies.species_id.in_(all_species_ids)
        ).first()

        # Get hourly activity pattern with species breakdown
        hourly_activity = db.session.query(
            VideoSpecies.species_id,
            func.strftime('%H', VideoSpecies.created_at).label('hour'),
            func.count().label('count')
        ).filter(
            VideoSpecies.species_id.in_(all_species_ids),
            VideoSpecies.created_at >= last_30d
        ).group_by(
            VideoSpecies.species_id,
            'hour'
        ).all()

        # Process hourly activity
        activity_by_species = {sid: [0] * 24 for sid in all_species_ids}
        activity_total = [0] * 24
        for species_id, hour, count in hourly_activity:
            hour_idx = int(hour)
            activity_by_species[species_id][hour_idx] = count
            activity_total[hour_idx] += count

        # Get weather preferences with all species combined
        weather_stats = db.session.query(
            func.round(Video.weather_temp).label('temp'),
            Video.weather_clouds,
            func.count().label('count')
        ).join(
            VideoSpecies, Video.id == VideoSpecies.video_id
        ).filter(
            VideoSpecies.species_id.in_(all_species_ids),
            Video.weather_temp.isnot(None)
        ).group_by(
            func.round(Video.weather_temp),
            Video.weather_clouds
        ).all()

        # Get food preferences with all species combined
        food_stats = db.session.query(
            BirdFood.name,
            func.count().label('count')
        ).join(
            video_bird_food_association,
            BirdFood.id == video_bird_food_association.c.birdfood_id
        ).join(
            Video,
            Video.id == video_bird_food_association.c.video_id
        ).join(
            VideoSpecies,
            VideoSpecies.video_id == Video.id
        ).filter(
            VideoSpecies.species_id.in_(all_species_ids)
        ).group_by(
            BirdFood.name
        ).order_by(
            func.count().desc()
        ).limit(5).all()

        # Construct response in new format
        response = {
            'species': {
                'id': species.id,
                'name': species.name,
                'image_url': species.image_url,
                'description': species.description,
                'active': species.active,
                'parent': {
                    'id': species.parent.id,
                    'name': species.parent.name
                } if species.parent else None
            },
            'stats': {
                'detections': {
                    'detections_24h': sum(stats_24h.values()),
                    'detections_7d': sum(stats_7d.values()),
                    'detections_30d': sum(stats_30d.values()),
                },
                'timeRange': {
                    'first_sighting': sightings.first.isoformat() if sightings.first else None,
                    'last_sighting': sightings.last.isoformat() if sightings.last else None,
                },
                'hourlyActivity': activity_total,
                'weather': [
                    {
                        'temp': temp,
                        'clouds': clouds,
                        'count': count
                    } for temp, clouds, count in weather_stats
                ],
                'food': [
                    {
                        'name': name,
                        'count': count
                    } for name, count in food_stats
                ]
            },
            'subspecies': [{
                'species': {
                    'id': child.id,
                    'name': child.name,
                    'image_url': child.image_url,
                },
                'stats': {
                    'detections': {
                        'detections_24h': stats_24h.get(child.id, 0),
                        'detections_7d': stats_7d.get(child.id, 0),
                        'detections_30d': stats_30d.get(child.id, 0),
                    },
                    'hourlyActivity': activity_by_species[child.id]
                }
            } for child in children]
        }

        return response

    @app.route('/api/ui/system/metrics', methods=['GET'])
    def system_metrics():
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=0.5)

            # Try to read Raspberry Pi CPU temperature
            try:
                with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
                    temp = float(f.read().strip()) / 1000.0
                cpu_temp = round(temp, 1)
            except:
                cpu_temp = None

            # Memory information
            memory = psutil.virtual_memory()
            memory_total_gb = round(memory.total / (1024**3), 1)
            memory_used_gb = round(memory.used / (1024**3), 1)
            memory_percent = memory.percent

            # Disk information for the root filesystem
            disk = psutil.disk_usage('/')
            disk_total_gb = round(disk.total / (1024**3), 1)
            disk_used_gb = round(disk.used / (1024**3), 1)
            disk_percent = disk.percent

            metrics = {
                'cpu': {
                    'percent': cpu_percent,
                    'temperature': cpu_temp
                },
                'memory': {
                    'total': memory_total_gb,
                    'used': memory_used_gb,
                    'percent': memory_percent
                },
                'disk': {
                    'total': disk_total_gb,
                    'used': disk_used_gb,
                    'percent': disk_percent
                }
            }

            return metrics

        except Exception as e:
            app.logger.error(f"Error getting system metrics: {str(e)}")
            return {'error': 'Failed to get system metrics'}, 500
