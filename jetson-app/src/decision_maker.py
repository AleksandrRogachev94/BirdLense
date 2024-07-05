class DecisionMaker():
    def __init__(self, trigger_frames=30):
        self.trigger_frames = trigger_frames
        self.reset()

    def reset(self):
        self.no_detect_count = 0
        self.bird_detected_cnt = 0
        self.squirrel_detected_cnt = 0

        self.stop_recording_decided = False
        self.bird_decided = False
        self.squirrel_decided = False

    def update(self, bird_detected, squirrel_detected):
        if not bird_detected and not squirrel_detected:
            self.no_detect_count += 1
        else:
            self.no_detect_count = 0

        if bird_detected:
            self.bird_detected_cnt += 1
        if squirrel_detected:
            self.squirrel_detected_cnt += 1

    def decide_stop_recording(self):
        if self.stop_recording_decided:
            # already decided once
            return False
        decision = not self.stop_recording_decided and self.no_detect_count >= self.trigger_frames
        self.stop_recording_decided = decision
        return decision

    def decide_squirrel(self):
        if self.squirrel_decided:
            # already decided once
            return False
        decision = not self.squirrel_decided and self.squirrel_detected_cnt >= self.trigger_frames
        self.squirrel_decided = decision
        return decision

    def decide_bird(self):
        if self.bird_decided:
            # already decided once
            return False
        decision = not self.bird_decided and self.bird_detected_cnt >= self.trigger_frames
        self.bird_decided = decision
        return decision
