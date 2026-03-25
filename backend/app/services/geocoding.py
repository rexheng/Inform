"""Postcode geocoding via postcodes.io (free, no API key needed)."""

import math

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models import PostcodeCache


async def geocode_postcode(postcode: str, db: Session) -> tuple[float, float]:
    """Geocode a UK postcode. Returns (latitude, longitude).

    Checks cache first, falls back to postcodes.io API.
    Raises ValueError if postcode is invalid.
    """
    normalised = postcode.replace(" ", "").upper()

    # Check cache
    cached = db.query(PostcodeCache).filter(PostcodeCache.postcode == normalised).first()
    if cached:
        return cached.latitude, cached.longitude

    # Call postcodes.io
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.postcodes_io_url}/postcodes/{normalised}",
            timeout=10.0,
        )

    if resp.status_code == 404:
        raise ValueError(f"Invalid postcode: {postcode}")
    resp.raise_for_status()

    data = resp.json()["result"]
    lat, lng = data["latitude"], data["longitude"]

    # Cache it
    db.add(PostcodeCache(postcode=normalised, latitude=lat, longitude=lng))
    db.commit()

    return lat, lng


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in km."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
