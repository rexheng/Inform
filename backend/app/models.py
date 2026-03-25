from datetime import datetime

from sqlalchemy import Float, Integer, String, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Provider(Base):
    __tablename__ = "providers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ods_code: Mapped[str] = mapped_column(String(10), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    postcode: Mapped[str] = mapped_column(String(10))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    region: Mapped[str] = mapped_column(String(50), default="London")


class WaitTime(Base):
    __tablename__ = "wait_times"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ods_code: Mapped[str] = mapped_column(String(10), index=True)
    period: Mapped[str] = mapped_column(String(30))  # e.g. "January 2026"
    standard: Mapped[str] = mapped_column(String(10))  # FDS, 31D, 62D
    cancer_type: Mapped[str] = mapped_column(String(100))
    total_patients: Mapped[int] = mapped_column(Integer, default=0)
    within_standard: Mapped[int] = mapped_column(Integer, default=0)
    after_standard: Mapped[int] = mapped_column(Integer, default=0)
    performance: Mapped[float] = mapped_column(Float, default=0.0)  # 0-1
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint(
            "ods_code", "period", "standard", "cancer_type",
            name="uq_wait_time_record",
        ),
    )


class PostcodeCache(Base):
    __tablename__ = "postcodes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    postcode: Mapped[str] = mapped_column(String(10), unique=True, index=True)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    cached_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
