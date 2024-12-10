from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional, Tuple
from models import Video, Species, VideoSpecies, SpeciesVisit
from util import update_species_info_from_wiki


class VisitProcessor:
    def __init__(self, db, logger, visit_timeout: int = 30):
        self.db = db
        self.logger = logger
        self.visit_timeout = visit_timeout

    def process_video_detection(self, species: Species, video: Video,
                                detection_start: float, detection_end: float,
                                confidence: float) -> Tuple[SpeciesVisit, VideoSpecies]:
        """
        Process a video detection and create/update associated visit.
        Returns the visit and video_species record.
        """
        detection_time = video.start_time + timedelta(seconds=detection_start)
        visit, _ = self._get_or_create_visit(species, detection_time)

        # Extend visit duration
        visit.end_time = max(
            visit.end_time,
            video.start_time + timedelta(seconds=detection_end)
        )

        # Create video species record
        video_species = VideoSpecies(
            species_id=species.id,
            start_time=detection_start,
            end_time=detection_end,
            confidence=confidence,
            source='video',
            created_at=detection_time,
            species_visit=visit,
            video=video
        )
        self.db.session.add(video_species)

        return visit, video_species

    def process_audio_detection(self, species: Species, video: Video,
                                detection_start: float, detection_end: float,
                                confidence: float) -> Optional[VideoSpecies]:
        """
        Process an audio detection and associate it with an existing visit if found.
        Returns the video_species record if successful.
        """
        detection_time = video.start_time + timedelta(seconds=detection_start)
        visit = self._find_active_visit_for_audio(species, detection_time)

        if not visit:
            return None

        # Create video species record
        video_species = VideoSpecies(
            species_id=species.id,
            start_time=detection_start,
            end_time=detection_end,
            confidence=confidence,
            source='audio',
            created_at=detection_time,
            species_visit=visit,
            video=video
        )
        self.db.session.add(video_species)

        return video_species

    def process_detections(self, video: Video, detections: List[Dict]) -> List[VideoSpecies]:
        """
        Process all detections for a video and manage visits.
        Returns list of created VideoSpecies records.
        """
        video_species_records = []
        visits_to_update = set()

        # First pass: Process all detections
        for det in detections:
            species = Species.query.filter_by(name=det['species_name']).first()
            if not species:
                self.logger.warn(f'Unknown species "{det["species_name"]}"')
                continue

            # Update species info from Wikipedia
            update_species_info_from_wiki(species)

            if det['source'] == 'video':
                visit, video_species = self.process_video_detection(
                    species=species,
                    video=video,
                    detection_start=det['start_time'],
                    detection_end=det['end_time'],
                    confidence=det['confidence']
                )
                visits_to_update.add(visit)
                video_species_records.append(video_species)
            else:  # audio
                video_species = self.process_audio_detection(
                    species=species,
                    video=video,
                    detection_start=det['start_time'],
                    detection_end=det['end_time'],
                    confidence=det['confidence']
                )
                if video_species:
                    video_species_records.append(video_species)

        # Second pass: Update simultaneous counts for affected visits
        for visit in visits_to_update:
            self._update_simultaneous_count(visit)

        return video_species_records

    def _get_or_create_visit(self, species: Species, detection_time: datetime) -> Tuple[SpeciesVisit, bool]:
        """
        Gets existing or creates new visit for a species.
        Always creates visits at the detection species level.
        Returns tuple of (visit, was_created).
        """
        # Look for existing visit that ended recently or is still ongoing
        cutoff_time = detection_time - timedelta(seconds=self.visit_timeout)
        recent_visit = (SpeciesVisit.query
                        .filter(
                            SpeciesVisit.species_id == species.id,
                            SpeciesVisit.end_time >= cutoff_time
                        )
                        .order_by(SpeciesVisit.end_time.desc())
                        .first())

        if recent_visit:
            recent_visit.start_time = recent_visit.start_time.replace(
                tzinfo=timezone.utc)
            recent_visit.end_time = recent_visit.end_time.replace(
                tzinfo=timezone.utc)
            recent_visit.created_at = recent_visit.created_at.replace(
                tzinfo=timezone.utc)
            return recent_visit, False

        # Create new visit
        visit = SpeciesVisit(
            species_id=species.id,
            start_time=detection_time,
            end_time=detection_time,
            max_simultaneous=1
        )
        self.db.session.add(visit)
        return visit, True

    def _find_active_visit_for_audio(self, audio_species: Species, detection_time: datetime) -> Optional[SpeciesVisit]:
        """
        Find an active visit for an audio detection.
        Looks for visits of the audio species or its direct children.
        """
        cutoff_time = detection_time - timedelta(seconds=self.visit_timeout)

        # Get IDs of direct child species
        child_species = Species.query.filter_by(
            parent_id=audio_species.id).all()
        species_ids = [audio_species.id] + [s.id for s in child_species]

        return (SpeciesVisit.query
                .filter(
                    SpeciesVisit.species_id.in_(species_ids),
                    SpeciesVisit.end_time >= cutoff_time
                )
                .order_by(SpeciesVisit.end_time.desc())
                .first())

    def _update_simultaneous_count(self, visit: SpeciesVisit) -> None:
        """Updates max_simultaneous count based on overlapping video detections"""
        video_detections = [
            vs for vs in visit.video_species if vs.source == 'video']
        if not video_detections:
            return

        # Sort by start time
        sorted_detections = sorted(
            video_detections, key=lambda x: x.start_time)

        # Count overlapping intervals
        max_concurrent = 1
        for i, curr in enumerate(sorted_detections):
            concurrent = 1
            for other in sorted_detections[i+1:]:
                if curr.end_time >= other.start_time:
                    concurrent += 1
                else:
                    break
            max_concurrent = max(max_concurrent, concurrent)

        visit.max_simultaneous = max_concurrent
