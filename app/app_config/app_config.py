import yaml
import os


class AppConfig:
    def __init__(self, user_config='user_config.yaml', default_config='default_config.yaml'):
        self.user_config_file = f"{os.path.dirname(__file__)}/{user_config}"
        self.default_config_file = f"{os.path.dirname(__file__)}/{default_config}"
        self.config = self.load_and_merge_configs()

    def load_and_merge_configs(self):
        # Load default config
        if not os.path.exists(self.default_config_file):
            raise FileNotFoundError(
                f"Default configuration file {self.default_config_file} not found."
            )

        with open(self.default_config_file, 'r') as file:
            default_config = yaml.safe_load(file) or {}

        # Load user config if it exists
        user_config = {}
        if os.path.exists(self.user_config_file):
            with open(self.user_config_file, 'r') as file:
                user_config = yaml.safe_load(file) or {}
                print(user_config)

        # Merge configs (user_config overrides default_config)
        return self.merge_dicts(default_config, user_config)

    @staticmethod
    def merge_dicts(base, overrides):
        """Recursively merges two dictionaries."""
        for key, value in overrides.items():
            if isinstance(value, dict) and key in base and isinstance(base[key], dict):
                base[key] = AppConfig.merge_dicts(base[key], value)
            else:
                base[key] = value
        return base

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

    def save(self, filename=None):
        save_file = filename or self.user_config_file
        with open(save_file, 'w') as file:
            yaml.safe_dump(self.config, file)


app_config = AppConfig()
