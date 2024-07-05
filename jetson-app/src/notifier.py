import logging


class Notifier():
    def __init__(self):
        self.logger = logging.getLogger(__name__)

    def notify_bird(self):
        self.logger.info('Notifying about bird presence')

    def notify_squirrel(self):
        self.logger.info('Notifying about squirrel presence')
