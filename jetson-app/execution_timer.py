from timeit import default_timer

class ExecutionTimer:
    def __init__(self):
        self.timer = default_timer
        self.end_time = None
    
    def __call__(self):
        return self.timer()
    
    def __enter__(self):
        self.start_time = self()
        return self

    def __exit__(self, exc_type, exc_value, exc_traceback):
        self.end_time = self()
        print("********************** ExecutionTimer FPS:", 1 / self.elapsed)

    @property
    def elapsed(self):
        if self.end_time is None:
            return self() - self.start_time
        else:
            return self.end_time - self.start_time