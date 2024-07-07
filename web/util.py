import os
import requests
import time

api_url = f'https://api.openweathermap.org/data/2.5/weather'

default_params = {
    'lat': os.environ['LATITUDE'],
    'lon': os.environ['LONGITUDE'],
    'appid': os.environ['OPENWEATHERMAP_KEY'],
    'units': 'metric'
}


def fetch_weather_data(params=default_params, retries=3, backoff_factor=2):
    """
    Fetches weather data from the given API URL with retry logic.

    :param params: Dictionary of query parameters to send with the API request.
    :param retries: Number of retries before giving up.
    :param backoff_factor: Factor by which to multiply the delay between retries.
    :return: JSON response from the API or an empty dictionary if all retries fail.
    """
    delay = 1
    for attempt in range(retries):
        try:
            response = requests.get(api_url, params=params)
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
            print(f"Attempt {attempt + 1} failed: {e}")
            if attempt < retries - 1:
                time.sleep(delay)
                delay *= backoff_factor
            else:
                print("All retries failed. Returning empty object.")
                return {}
