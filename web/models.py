import datetime
from typing import List
from sqlalchemy import String, DateTime, Table, ForeignKey, Column
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from flask_sqlalchemy import SQLAlchemy


class Base(DeclarativeBase):
    pass


db = SQLAlchemy(model_class=Base)

# Association tables for many-to-many relationships
video_species_association = Table(
    'video_species_association', Base.metadata,
    Column('video_id', String, ForeignKey('videos.id')),
    Column('species_id', String, ForeignKey('species.id'))
)

video_bird_food_association = Table(
    'video_bird_food_association', Base.metadata,
    Column('video_id', String, ForeignKey('videos.id')),
    Column('birdfood_id', String, ForeignKey('bird_food.id'))
)


class Species(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False)
    photo: Mapped[str]
    description: Mapped[str]


class BirdFood(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False)
    active: Mapped[bool] = mapped_column(
        nullable=False, server_default='FALSE')


class Videos(db.Model):
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
        nullable=False, server_default='FALSE')
    # Weather data
    weather_main: Mapped[str]  # short category, e.g., Rain
    # longer description, e.g., light intensity drizzle
    weather_description: Mapped[str]
    weather_temp: Mapped[int]  # temperature in C
    weather_humidity: Mapped[int]  # humidity, %
    weather_pressure: Mapped[int]  # atmospheric pressure on the sea level, hPa
    weather_clouds: Mapped[int]  # cloudiness, %
    weather_wind_speed: Mapped[int]  # wind speed, meter/sec

    # Relations
    species: Mapped[List[Species]] = relationship(
        secondary=video_species_association)
    food: Mapped[List[BirdFood]] = relationship(
        secondary=video_bird_food_association)
