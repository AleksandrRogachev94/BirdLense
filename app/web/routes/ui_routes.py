from flask import request
from sqlalchemy import func, case, distinct, or_
from sqlalchemy.orm import aliased
from datetime import datetime, timezone, timedelta
from models import ActivityLog, db, BirdFood, Video, Species, VideoSpecies, SpeciesVisit, video_bird_food_association
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
            BirdFood.name.asc()).all()
        bird_food_list = [{
            'id': food.id,
            'name': food.name,
            'active': food.active,
            'description': food.description,
            'image_url': food.image_url
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
            Species.name.label('name'),
            *[
                func.sum(
                    case(
                        (func.strftime('%H', SpeciesVisit.start_time) == str(hour).zfill(2),
                         SpeciesVisit.max_simultaneous),
                        else_=0
                    )
                ).label(f'detection_hour_{hour}')
                for hour in range(24)
            ]
        ).join(
            Species, Species.id == active_species_subq.c.group_id
        ).join(
            SpeciesVisit, SpeciesVisit.species_id == active_species_subq.c.id
        ).filter(
            SpeciesVisit.start_time >= start_of_day,
            SpeciesVisit.start_time <= end_of_day
        ).group_by(
            active_species_subq.c.group_id
        ).order_by(
            func.sum(SpeciesVisit.max_simultaneous).desc()
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

        # Statistics query
        stats_query = db.session.query(
            func.count(distinct(active_species_subq.c.group_id)
                       ).label('uniqueSpecies'),
            func.sum(SpeciesVisit.max_simultaneous).label('totalDetections'),
            func.sum(
                case(
                    (SpeciesVisit.start_time >= date - timedelta(hours=1),
                     SpeciesVisit.max_simultaneous),
                    else_=0
                )
            ).label('lastHourDetections'),
            func.avg(
                func.strftime('%s', SpeciesVisit.end_time) -
                func.strftime('%s', SpeciesVisit.start_time)
            ).label('avgVisitDuration'),
            func.strftime('%H', func.max(SpeciesVisit.start_time)
                          ).label('busiestHour')
        ).join(
            active_species_subq, SpeciesVisit.species_id == active_species_subq.c.id
        ).filter(
            SpeciesVisit.start_time >= start_of_day,
            SpeciesVisit.start_time <= end_of_day
        ).first()

        # Calculate total detection durations by source
        source_duration_query = db.session.query(
            func.sum(
                case(
                    (VideoSpecies.source == 'video',
                     VideoSpecies.end_time - VideoSpecies.start_time),
                    else_=0
                )
            ).label('video_duration'),
            func.sum(
                case(
                    (VideoSpecies.source == 'audio',
                     VideoSpecies.end_time - VideoSpecies.start_time),
                    else_=0
                )
            ).label('audio_duration')
        ).join(
            SpeciesVisit, VideoSpecies.species_visit_id == SpeciesVisit.id
        ).filter(
            SpeciesVisit.start_time >= start_of_day,
            SpeciesVisit.start_time <= end_of_day
        ).first()

        # Format stats data
        stats = {
            'uniqueSpecies': stats_query.uniqueSpecies if stats_query.uniqueSpecies else 0,
            'totalDetections': stats_query.totalDetections if stats_query.totalDetections else 0,
            'lastHourDetections': stats_query.lastHourDetections if stats_query.lastHourDetections else 0,
            'busiestHour': int(stats_query.busiestHour) if stats_query.busiestHour else 0,
            # in seconds
            'avgVisitDuration': round(stats_query.avgVisitDuration or 0),
            # in seconds
            'videoDuration': round(source_duration_query.video_duration or 0),
            # in seconds
            'audioDuration': round(source_duration_query.audio_duration or 0)
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
            return {'error': 'Invalid datetime format'}, 400

        # Ensure the interval is no more than 1 day
        if end_time - start_time > timedelta(days=1):
            return {'error': 'The interval between start_time and end_time must not exceed 1 day'}, 400

        # Query SpeciesVisit records within the interval
        visits = (
            db.session.query(SpeciesVisit)
            .join(Species)
            .join(VideoSpecies)
            .join(Video)
            .filter(
                SpeciesVisit.start_time >= start_time,
                SpeciesVisit.end_time <= end_time
            )
            .order_by(SpeciesVisit.start_time.desc())
            .all()
        )

        # Construct the response
        response = []
        for visit in visits:
            # Get the first video for weather data (assuming similar conditions during visit)
            video = visit.video_species[0].video if visit.video_species else None

            # Prepare detections for this visit
            detections = []
            sorted_video_species = sorted(
                visit.video_species, key=lambda x: x.created_at, reverse=True)
            for video_species in sorted_video_species:
                video_start_time = video_species.video.start_time
                detections.append({
                    'video_id': video_species.video_id,
                    'start_time': (video_start_time + timedelta(seconds=video_species.start_time)).astimezone(timezone.utc).isoformat(),
                    'end_time': (video_start_time + timedelta(seconds=video_species.end_time)).astimezone(timezone.utc).isoformat(),
                    'confidence': video_species.confidence,
                    'source': video_species.source
                })

            response.append({
                'id': visit.id,
                'start_time': visit.start_time.astimezone(timezone.utc).isoformat(),
                'end_time': visit.end_time.astimezone(timezone.utc).isoformat(),
                'max_simultaneous': visit.max_simultaneous,
                'weather': {
                    'temp': video.weather_temp if video else None,
                    'clouds': video.weather_clouds if video else None,
                } if video else None,
                'species': {
                    'id': visit.species.id,
                    'name': visit.species.name,
                    'image_url': visit.species.image_url,
                    'parent_id': visit.species.parent_id,
                },
                'detections': detections
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

        # Function to get visit stats with species breakdown
        def get_visit_stats(since_time):
            return db.session.query(
                SpeciesVisit.species_id,
                func.sum(SpeciesVisit.max_simultaneous).label(
                    'count')  # Multiply by simultaneous count
            ).filter(
                SpeciesVisit.species_id.in_(all_species_ids),
                SpeciesVisit.start_time >= since_time
            ).group_by(
                SpeciesVisit.species_id
            ).all()

        # Get visit stats with species breakdown
        stats_24h = dict(get_visit_stats(last_24h))
        stats_7d = dict(get_visit_stats(last_7d))
        stats_30d = dict(get_visit_stats(last_30d))

        # Get first and last sighting dates across all species
        sightings = db.session.query(
            func.min(SpeciesVisit.start_time).label('first'),
            func.max(SpeciesVisit.end_time).label('last')
        ).filter(
            SpeciesVisit.species_id.in_(all_species_ids)
        ).first()

        # Get hourly activity pattern with species breakdown
        hourly_activity = db.session.query(
            SpeciesVisit.species_id,
            func.strftime('%H', SpeciesVisit.start_time).label('hour'),
            func.sum(SpeciesVisit.max_simultaneous).label(
                'count')  # Multiply by simultaneous count
        ).filter(
            SpeciesVisit.species_id.in_(all_species_ids),
            SpeciesVisit.start_time >= last_30d
        ).group_by(
            SpeciesVisit.species_id,
            'hour'
        ).all()

        # Process hourly activity
        activity_by_species = {sid: [0] * 24 for sid in all_species_ids}
        activity_total = [0] * 24
        for species_id, hour, count in hourly_activity:
            hour_idx = int(hour)
            activity_by_species[species_id][hour_idx] = int(count or 0)
            activity_total[hour_idx] += int(count or 0)

        # Get weather preferences with all species combined using visits
        weather_stats = db.session.query(
            func.round(Video.weather_temp).label('temp'),
            Video.weather_clouds,
            func.sum(SpeciesVisit.max_simultaneous).label(
                'count')  # Multiply by simultaneous count
        ).join(
            VideoSpecies, Video.id == VideoSpecies.video_id
        ).join(
            SpeciesVisit, VideoSpecies.species_visit_id == SpeciesVisit.id
        ).filter(
            SpeciesVisit.species_id.in_(all_species_ids),
            Video.weather_temp.isnot(None)
        ).group_by(
            func.round(Video.weather_temp),
            Video.weather_clouds
        ).all()

        # Get food preferences with all species combined using visits
        food_stats = db.session.query(
            BirdFood.name,
            func.sum(SpeciesVisit.max_simultaneous).label(
                'count')  # Multiply by simultaneous count
        ).join(
            video_bird_food_association,
            BirdFood.id == video_bird_food_association.c.birdfood_id
        ).join(
            Video,
            Video.id == video_bird_food_association.c.video_id
        ).join(
            VideoSpecies, VideoSpecies.video_id == Video.id
        ).join(
            SpeciesVisit, VideoSpecies.species_visit_id == SpeciesVisit.id
        ).filter(
            SpeciesVisit.species_id.in_(all_species_ids)
        ).group_by(
            BirdFood.name
        ).order_by(
            func.sum(SpeciesVisit.max_simultaneous).desc()
        ).limit(5).all()

        # Construct response
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
                'detections': {  # Kept original interface
                    'detections_24h': sum(stats_24h.values() or [0]),
                    'detections_7d': sum(stats_7d.values() or [0]),
                    'detections_30d': sum(stats_30d.values() or [0]),
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
                        'count': int(count or 0)
                    } for temp, clouds, count in weather_stats
                ],
                'food': [
                    {
                        'name': name,
                        'count': int(count or 0)
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

    @app.route('/api/ui/activity', methods=['GET'])
    def get_activity():
        month = request.args.get('month', datetime.now().strftime('%Y-%m'))
        start_date = datetime.strptime(month, '%Y-%m')
        end_date = (start_date.replace(day=1) +
                    timedelta(days=32)).replace(day=1)

        activities = db.session.query(
            func.strftime('%Y-%m-%d', ActivityLog.created_at).label('date'),
            func.sum(
                func.strftime('%s', ActivityLog.updated_at) -
                func.strftime('%s', ActivityLog.created_at)
            ).label('total_uptime')  # in seconds
        ).filter(
            ActivityLog.type == 'heartbeat',
            ActivityLog.created_at >= start_date,
            ActivityLog.created_at < end_date
        ).group_by(
            func.strftime('%Y-%m-%d', ActivityLog.created_at)
        ).all()

        return [{
            'date': day,
            # convert to hours
            'totalUptime': round(duration / 3600, 1) if duration else 0
        } for day, duration in activities]
