import os
from datetime import datetime
from datetime import datetime, timezone, timedelta
import psutil
from flask import request
import shutil
from models import ActivityLog, db
from sqlalchemy import func

RECORDINGS_DIR = "data/recordings"


def register_routes(app):
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

    @app.route('/api/ui/system/activity', methods=['GET'])
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

    def get_day_storage_info(day_path):
        """Get total size and file count for a day directory including all timestamp subdirs"""
        total_size = 0
        total_files = 0
        try:
            # Iterate through timestamp directories
            for timestamp in os.listdir(day_path):
                timestamp_path = os.path.join(day_path, timestamp)
                if not os.path.isdir(timestamp_path):
                    continue

                # Count all files in timestamp directory
                for file in os.listdir(timestamp_path):
                    file_path = os.path.join(timestamp_path, file)
                    if os.path.isfile(file_path):
                        try:
                            total_size += os.path.getsize(file_path)
                            total_files += 1
                        except OSError as e:
                            app.logger.error(
                                f"Error getting size for {file_path}: {e}")

        except Exception as e:
            app.logger.error(f"Error processing day directory {day_path}: {e}")

        return total_files, total_size

    @app.route('/api/ui/storage/stats', methods=['GET'])
    def get_storage_stats():
        if not os.path.exists(RECORDINGS_DIR):
            return [], 200

        stats = []
        # Walk through year/month/day structure
        try:
            for year in sorted(os.listdir(RECORDINGS_DIR), reverse=True):
                year_path = os.path.join(RECORDINGS_DIR, year)
                if not os.path.isdir(year_path):
                    continue

                for month in sorted(os.listdir(year_path), reverse=True):
                    month_path = os.path.join(year_path, month)
                    if not os.path.isdir(month_path):
                        continue

                    for day in sorted(os.listdir(month_path), reverse=True):
                        day_path = os.path.join(month_path, day)
                        if not os.path.isdir(day_path):
                            continue

                        # Get storage info for this day (including all timestamp subdirs)
                        file_count, total_size = get_day_storage_info(day_path)

                        if file_count > 0:  # Only include days with files
                            stats.append({
                                'date': f"{year}-{month}-{day}",
                                'fileCount': file_count,
                                'totalSize': total_size
                            })

        except Exception as e:
            app.logger.error(f"Error scanning recordings directory: {e}")

        return stats, 200

    @app.route('/api/ui/storage/purge', methods=['POST'])
    def purge_storage():
        try:
            date_str = request.json.get('date')
            if not date_str:
                return {'error': 'Date is required'}, 400

            purge_date = datetime.strptime(date_str, '%Y-%m-%d')
            deleted_count = 0
            deleted_size = 0

            # Walk through the recordings directory
            for year in os.listdir(RECORDINGS_DIR):
                year_path = os.path.join(RECORDINGS_DIR, year)
                if not os.path.isdir(year_path):
                    continue

                for month in os.listdir(year_path):
                    month_path = os.path.join(year_path, month)
                    if not os.path.isdir(month_path):
                        continue

                    for day in os.listdir(month_path):
                        day_path = os.path.join(month_path, day)
                        if not os.path.isdir(day_path):
                            continue

                        # Check if this directory is before or on purge date
                        dir_date = datetime.strptime(
                            f"{year}-{month}-{day}", '%Y-%m-%d')
                        if dir_date <= purge_date:
                            # Calculate stats before deletion
                            count, size = get_day_storage_info(day_path)
                            deleted_count += count
                            deleted_size += size

                            # Remove the directory and all contents
                            shutil.rmtree(day_path)

                    # Clean up empty month directory
                    if not os.listdir(month_path):
                        os.rmdir(month_path)

                # Clean up empty year directory
                if not os.listdir(year_path):
                    os.rmdir(year_path)

            return {
                'message': f'Successfully deleted {deleted_count} files',
                'deletedCount': deleted_count,
                'deletedSize': deleted_size
            }, 200

        except Exception as e:
            app.logger.error(f"Error during purge: {str(e)}")
            return {'error': str(e)}, 500
