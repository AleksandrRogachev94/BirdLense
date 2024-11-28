from datetime import timedelta, datetime
import requests
import re
import time
from app_config.app_config import app_config
import logging


class WeatherFetcher:
    def __init__(self, api_url, latitude, longitude, api_key, cache_duration=timedelta(minutes=10)):
        self.api_url = api_url
        self.latitude = latitude
        self.longitude = longitude
        self.api_key = api_key
        self.cache_duration = cache_duration
        self.last_fetched = None
        self.cached_data = None
        self.default_params = {
            'lat': self.latitude,
            'lon': self.longitude,
            'appid': self.api_key,
            'units': 'metric'
        }

    def _is_cache_valid(self):
        """Check if the cached data is still valid."""
        if not self.cached_data or not self.last_fetched:
            return False
        return datetime.now() - self.last_fetched < self.cache_duration

    def _fetch_weather_data(self, params=None, retries=3, backoff_factor=2):
        """
        Fetches weather data from the API with retry logic.
        """
        params = params or self.default_params
        if not params['appid']:
            return {}
        delay = 1
        for attempt in range(retries):
            try:
                response = requests.get(self.api_url, params=params)
                response.raise_for_status()  # Raise an HTTPError for bad responses (4xx and 5xx)
                data = response.json()
                return {
                    'weather_main': data['weather'][0]['main'],
                    'weather_description': data['weather'][0]['description'],
                    'weather_temp': data['main']['temp'],
                    'weather_humidity': data['main']['humidity'],
                    'weather_pressure': data['main']['pressure'],
                    'weather_clouds': data['clouds']['all'],
                    'weather_wind_speed': data['wind']['speed']
                }
            except requests.RequestException as e:
                if attempt < retries - 1:
                    time.sleep(delay)
                    delay *= backoff_factor
                else:
                    logging.error(
                        f"All retries failed. Returning empty object. Error: {e}")
                    return {}

    def fetch(self):
        """
        Returns cached weather data if valid, otherwise fetches new data.
        """
        if self._is_cache_valid():
            return self.cached_data
        new_data = self._fetch_weather_data()
        self.cached_data = new_data
        self.last_fetched = datetime.now()
        return new_data


weather_fetcher = WeatherFetcher(
    api_url='https://api.openweathermap.org/data/2.5/weather',
    latitude=app_config.get('secrets.latitude'),
    longitude=app_config.get('secrets.longitude'),
    api_key=app_config.get('secrets.openweather_api_key')
)


def build_hierarchy_tree():
    species_dict = {}

    with open("seed/hierarchy_names.txt", "r") as file:
        lines = file.readlines()
    for line in lines:
        species_name, parent_name = line.strip().split("|")
        species_dict[species_name] = parent_name

    # Step 1: Create a map to store child-parent relationships
    children_map = {}
    for child, parent in species_dict.items():
        if parent not in children_map:
            children_map[parent] = []
        children_map[parent].append(child)

    # Step 2: Define a recursive function to build the tree
    def build_tree_from_parent(parent):
        if parent not in children_map:
            return {}
        return {child: build_tree_from_parent(child) for child in children_map[parent]}

    # Find the root nodes (those which are parents but not children)
    root_nodes = set(species_dict.values()) - set(species_dict.keys())

    # Build the tree for each root node
    return {root: build_tree_from_parent(root) for root in root_nodes}


def get_wikipedia_image_and_description(title):
    # URL encode the title
    url = f"https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|pageprops|extracts&format=json&piprop=thumbnail&titles={title}&pithumbsize=300&redirects&exintro"

    # Send request to the API
    response = requests.get(url)

    # Parse the JSON response
    data = response.json()

    # Check if the response contains the expected data
    if "query" in data and "pages" in data["query"]:
        page_info = data["query"]["pages"]

        # Get the page ID (assuming the first page in the response)
        page_id = next(iter(page_info))

        page = page_info[page_id]

        # Extract image URL and description
        image_url = page.get("thumbnail", {}).get(
            "source", "No image available")
        description_html = page.get("extract", "No description available")

        # Clean up description by removing HTML tags and trimming spaces and newlines
        description = re.sub(r'<[^>]*>', '', description_html).strip()

        # Return image URL and cleaned description
        return image_url, description
    else:
        return None, "No data found"


def notify(message, link="", tags=None):
    if app_config.get('general.enable_notifications'):
        requests.post("http://ntfy/birdlense",
                      data=message.encode(
                          'utf-8'),
                      headers={
                          "Title": "BirdLense",
                          "Click": f"http://smartbirdfeeder.local/{link}",
                          "Tags": tags
                      })
