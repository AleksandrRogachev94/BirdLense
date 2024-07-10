import logging
import requests
import os


class Notifier():
    def __init__(self):
        self.logger = logging.getLogger(__name__)

    def notify_bird(self):
        self.logger.info('Notifying about bird presence')
        requests.post(f"{os.environ['API_URL_BASE']}/notify", json={ 'detection': 'bird' })

    def notify_squirrel(self):
        self.logger.info('Notifying about squirrel presence')
        requests.post(f"{os.environ['API_URL_BASE']}/notify", json={ 'detection': 'squirrel' })
