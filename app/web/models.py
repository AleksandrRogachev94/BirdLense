import datetime
from typing import List
from sqlalchemy import String, Integer, Float, DateTime, Table, ForeignKey, Column, Index, desc
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from flask_sqlalchemy import SQLAlchemy


class Base(DeclarativeBase):
    pass


db = SQLAlchemy(model_class=Base)


# Many-To-Many with additional columns
class VideoSpecies(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    video_id: Mapped[int] = mapped_column(Integer, ForeignKey("video.id"))
    species_id: Mapped[int] = mapped_column(Integer, ForeignKey("species.id"))
    species_visit_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("species_visit.id"), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False)
    start_time: Mapped[float] = mapped_column(
        Float, nullable=False)  # seconds, relative to video.start_time
    end_time: Mapped[float] = mapped_column(
        Float, nullable=False)  # seconds, relative to video.start_time
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    source: Mapped[str] = mapped_column(
        String, nullable=False)  # video or audio
    video: Mapped["Video"] = relationship(back_populates="video_species")
    species: Mapped["Species"] = relationship(back_populates="video_species")
    species_visit: Mapped["SpeciesVisit"] = relationship(
        back_populates="video_species")

    __table_args__ = (
        # improves both queries: created_at/species_id and just species_id
        Index('ix_videospecies_created_at_species',
              desc('created_at'), 'species_id'),
        Index('ix_videospecies_species_created_at',
              'species_id', desc('created_at')),
        # for video details queries
        Index('ix_videospecies_video_id', 'video_id'),
        Index('ix_videospecies_species_visit_id', 'species_visit_id'),
    )


# Many-To-Many
video_bird_food_association = Table(
    'video_bird_food_association', Base.metadata,
    Column('video_id', Integer, ForeignKey('video.id'), primary_key=True),
    Column('birdfood_id', Integer, ForeignKey(
        'bird_food.id'), primary_key=True),
)


class Species(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True, nullable=False)
    parent_id = mapped_column(Integer, ForeignKey("species.id"))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False)
    image_url: Mapped[str] = mapped_column(String(), nullable=True)
    description: Mapped[str] = mapped_column(String(), nullable=True)
    active: Mapped[bool] = mapped_column(
        nullable=False, default=False, server_default="false")
    video_species: Mapped[List["VideoSpecies"]
                          ] = relationship(back_populates="species")
    children = relationship("Species", back_populates="parent")
    parent = relationship(
        "Species", back_populates="children", remote_side=[id])
    species_visits: Mapped[List["SpeciesVisit"]
                           ] = relationship(back_populates="species")

    __table_args__ = (
        Index('ix_species_parent_id', 'parent_id'),
    )


class BirdFood(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True, nullable=False)
    description: Mapped[str] = mapped_column(String(), nullable=True)
    image_url: Mapped[str] = mapped_column(String(), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False)
    active: Mapped[bool] = mapped_column(
        nullable=False, default=False)


class Video(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False)
    processor_version: Mapped[str] = mapped_column(nullable=False)
    start_time: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False)
    video_path: Mapped[str] = mapped_column(nullable=False)
    spectrogram_path: Mapped[str] = mapped_column(
        String, nullable=True)  # spectrogram image
    favorite: Mapped[bool] = mapped_column(
        nullable=False, default=False, server_default="false")
    # Weather data
    weather_main: Mapped[str] = mapped_column(
        String(), nullable=True)  # short category, e.g., Rain
    weather_description: Mapped[str] = mapped_column(
        String(), nullable=True)  # long description, e.g., light intensity drizzle
    weather_temp: Mapped[int] = mapped_column(
        Float(precision=2), nullable=True)  # temperature in C
    weather_humidity: Mapped[int] = mapped_column(
        Integer(), nullable=True)  # humidity, %
    weather_pressure: Mapped[int] = mapped_column(
        Integer(), nullable=True)  # atmospheric pressure on the sea level, hPa
    weather_clouds: Mapped[int] = mapped_column(
        Integer(), nullable=True)  # cloudiness, %
    weather_wind_speed: Mapped[int] = mapped_column(
        Float(precision=2), nullable=True)  # wind speed, meter/sec

    # Relations
    video_species: Mapped[List["VideoSpecies"]
                          ] = relationship(back_populates="video")
    food: Mapped[List[BirdFood]] = relationship(
        secondary=video_bird_food_association)


class ActivityLog(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[str] = mapped_column(nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False)
    data: Mapped[str] = mapped_column(String(), nullable=True)

    __table_args__ = (
        Index('ix_activitylog_type_created_at', 'type', desc('created_at')),
    )


class SpeciesVisit(db.Model):
    """Represents a continuous period when a species species was present, groups video and audio detections"""
    id: Mapped[int] = mapped_column(primary_key=True)
    species_id: Mapped[int] = mapped_column(
        Integer, ForeignKey('species.id'), nullable=False)
    start_time: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False)
    max_simultaneous: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1)  # Max birds seen at once
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())

    species: Mapped["Species"] = relationship(back_populates="species_visits")
    video_species: Mapped[List["VideoSpecies"]] = relationship(
        back_populates="species_visit")

    __table_args__ = (
        Index('ix_speciesvisit_created_at_species',
              desc('start_time'), 'species_id'),
        Index('ix_speciesvisit_species_created_at',
              'species_id', desc('start_time')),
    )
