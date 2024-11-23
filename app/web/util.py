import requests
import time
from app_config.app_config import app_config

api_url = f"https://api.openweathermap.org/data/2.5/weather"

default_params = {
    "lat": app_config.get("secrets.latitude"),
    "lon": app_config.get("secrets.longitude"),
    "appid": app_config.get("secrets.openweather_api_key"),
    "units": "metric",
}


def fetch_weather_data(params=default_params, retries=3, backoff_factor=2):
    """
    Fetches weather data from the given API URL with retry logic.

    :param params: Dictionary of query parameters to send with the API request.
    :param retries: Number of retries before giving up.
    :param backoff_factor: Factor by which to multiply the delay between retries.
    :return: JSON response from the API or an empty dictionary if all retries fail.
    """
    if not params or "appid" not in params:
        print(f"Weather is not configured. Missing API key.")
        return {}
    for attempt in range(retries):
        try:
            response = requests.get(api_url, params=params)
            response.raise_for_status()  # Raise an HTTPError for bad responses (4xx and 5xx)
            data = response.json()
            return {
                "weather_main": data["weather"][0]["main"],
                "weather_description": data["weather"][0]["description"],
                "weather_temp": data["main"]["temp"],
                "weather_humidity": data["main"]["humidity"],
                "weather_pressure": data["main"]["pressure"],
                "weather_clouds": data["clouds"]["all"],
                "weather_wind_speed": data["wind"]["speed"],
            }
        except requests.RequestException as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            if attempt < retries - 1:
                time.sleep(delay)
                delay *= backoff_factor
            else:
                print("All retries failed. Returning empty object.")
                return {}


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
