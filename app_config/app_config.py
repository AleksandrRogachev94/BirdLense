import yaml
import os


class AppConfig:
    def __init__(self, config_file=f'app_config.yaml'):
        self.config_file = f"{os.path.dirname(__file__)}/{config_file}"
        self.config = self.load_config()

    def load_config(self):
        if not os.path.exists(self.config_file):
            raise FileNotFoundError(
                f"Configuration file {self.config_file} not found.")

        with open(self.config_file, 'r') as file:
            config = yaml.safe_load(file)

        return config

    def get(self, key, default=None):
        keys = key.split('.')
        value = self.config
        for k in keys:
            value = value.get(k, default)
            if value is None:
                return default
        return value

    def set(self, key, value):
        keys = key.split('.')
        config_section = self.config
        for k in keys[:-1]:
            config_section = config_section.setdefault(k, {})
        config_section[keys[-1]] = value

    def save(self):
        with open(self.config_file, 'w') as file:
            yaml.safe_dump(self.config, file)


app_config = AppConfig()
