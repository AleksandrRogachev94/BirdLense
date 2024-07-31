import datetime
from typing import List
from sqlalchemy import String, Integer, Float, DateTime, Table, ForeignKey, Column
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from flask_sqlalchemy import SQLAlchemy


class Base(DeclarativeBase):
    pass


db = SQLAlchemy(model_class=Base)


# Many-To-Many with additional columns
class VideoSpecies(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    video_id: Mapped[int] = mapped_column(ForeignKey("video.id"))
    species_id: Mapped[int] = mapped_column(ForeignKey("species.id"))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False)
    start_time: Mapped[float] = mapped_column(
        Float, nullable=False)  # seconds, relative to video.start_time
    end_time: Mapped[float] = mapped_column(
        Float, nullable=False)  # seconds, relative to video.start_time
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    source: Mapped[str] = mapped_column(
        String, nullable=False)  # video or audio
    spectrogram_path: Mapped[str] = mapped_column(
        String, nullable=True)  # spectrogram image for for source = 'audio'
    video: Mapped["Video"] = relationship(back_populates="video_species")
    species: Mapped["Species"] = relationship(back_populates="video_species")


# Many-To-Many
video_bird_food_association = Table(
    'video_bird_food_association', Base.metadata,
    Column('video_id', String, ForeignKey('video.id')),
    Column('birdfood_id', String, ForeignKey('bird_food.id'))
)


class Species(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True, nullable=False)
    parent_id = mapped_column(Integer, ForeignKey("species.id"))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False)
    photo: Mapped[str] = mapped_column(String(), nullable=True)
    description: Mapped[str] = mapped_column(String(), nullable=True)
    active: Mapped[bool] = mapped_column(
        nullable=False, default=False)
    video_species: Mapped[List["VideoSpecies"]
                          ] = relationship(back_populates="species")
    children = relationship("Species", back_populates="parent")
    parent = relationship(
        "Species", back_populates="children", remote_side=[id])


class BirdFood(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False)
    active: Mapped[bool] = mapped_column(
        nullable=False, default=False)


class Video(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False)
    video_processor_version: Mapped[str] = mapped_column(nullable=False)
    start_time: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False)
    video_path: Mapped[str] = mapped_column(nullable=False)
    audio_path: Mapped[str] = mapped_column(nullable=False)
    favorite: Mapped[bool] = mapped_column(
        nullable=False, default=False)
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
