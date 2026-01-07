from datetime import datetime
from collections import Counter, defaultdict
from google import genai
from models import db, Video, Species, SpeciesVisit
from app_config.app_config import app_config
import logging

logger = logging.getLogger(__name__)

# Define buckets once as a constant
TIME_BUCKETS = [
    ("Early Morning", 5, 8),
    ("Morning", 8, 11),
    ("Mid-Day", 11, 14),
    ("Afternoon", 14, 17),
    ("Evening", 17, 21),
]


def _get_time_bucket(hour: int) -> str | None:
    """Return bucket name for given hour, or None if outside daylight hours."""
    for name, start, end in TIME_BUCKETS:
        if start <= hour < end:
            return name
    return None


def _build_prompt(date: datetime, timeline_text: str) -> str:
    """Build the LLM prompt for daily summary generation."""
    return f"""You are an expert ornithologist and data analyst for BirdLense, a smart bird feeder system with a 3D-printed feeder, camera, and microphone that automatically detects and identifies visiting birds.

Note: The detection system uses AI and may occasionally misidentify species or miss visits.

Analyze the following timeline of bird visits and weather for {date.strftime('%Y-%m-%d')}:

{timeline_text}

Provide a concise, data-driven summary (3-4 sentences) that helps the user understand daily activity patterns.
Focus on:
1. Activity peaks/dips and their correlation with time of day or weather.
2. Dominant species behavior.
3. Any significant anomalies.

Avoid fluffy or overly conversational language. Be direct and insightful, but use simple, clear language suitable for a casual bird enthusiast.
"""


class DailySummaryService:
    @staticmethod
    def get_summary(start_of_day: datetime, end_of_day: datetime) -> dict:

        # Initialize buckets
        weather_by_bucket = defaultdict(list)
        visits_by_bucket = defaultdict(Counter)

        # 1. Gather Weather Data
        videos = db.session.query(
            Video.start_time, Video.weather_temp, Video.weather_main
        ).filter(
            Video.start_time >= start_of_day,
            Video.start_time <= end_of_day,
            Video.weather_temp.isnot(None)
        ).all()

        for v in videos:
            bucket = _get_time_bucket(v.start_time.hour)
            if bucket:
                weather_by_bucket[bucket].append((v.weather_temp, v.weather_main))

        # 2. Gather Bird Visits
        visits = db.session.query(
            SpeciesVisit.start_time, Species.name
        ).join(
            Species, SpeciesVisit.species_id == Species.id
        ).filter(
            SpeciesVisit.start_time >= start_of_day,
            SpeciesVisit.start_time <= end_of_day
        ).all()

        if not visits:
            return {'summary': "No bird visits recorded for this date."}

        for v in visits:
            bucket = _get_time_bucket(v.start_time.hour)
            if bucket:
                visits_by_bucket[bucket][v.name] += 1

        # 3. Build Timeline Text
        timeline_parts = []
        for name, _, _ in TIME_BUCKETS:
            weather = weather_by_bucket.get(name)
            species_counts = visits_by_bucket.get(name)

            if not weather and not species_counts:
                continue

            lines = [f"[{name}]"]

            # Weather summary
            if weather:
                avg_temp = sum(t for t, _ in weather) / len(weather)
                conditions = [c for _, c in weather if c]
                common_cond = Counter(conditions).most_common(1)[0][0] if conditions else "Unknown"
                lines.append(f"Weather: {avg_temp:.0f}°C, {common_cond}")
            else:
                lines.append("Weather: No data")

            # Activity summary
            if species_counts:
                activity = ", ".join(f"{sp}: {ct}" for sp, ct in species_counts.items())
                lines.append(f"Activity: {activity}")
            else:
                lines.append("Activity: None")

            timeline_parts.append("\n".join(lines))

        if not timeline_parts:
            return {'summary': "No significant activity recorded during daylight hours."}

        timeline_text = "\n\n".join(timeline_parts)

        logger.info('!!! TIMELINE TEXT !!!')
        logger.info(timeline_text)

        # 4. Generate Summary via LLM
        api_key = app_config.get('ai.gemini_api_key')
        if not api_key:
            raise ValueError('Gemini API key not configured in settings.')

        model = app_config.get('ai.model')
        prompt = _build_prompt(date, timeline_text)

        try:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model=model,
                contents=prompt
            )
            return {'summary': response.text}
        except Exception as e:
            logger.error(f"Gemini generation error: {e}")
            raise
