"""Load parsed data into the database."""

from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.models import Provider, WaitTime
from app.etl.london_trusts import LONDON_TRUSTS


def seed_providers(db: Session) -> None:
    """Insert or update London trust provider records."""
    for ods_code, info in LONDON_TRUSTS.items():
        stmt = pg_insert(Provider).values(
            ods_code=ods_code,
            name=info["name"],
            postcode=info["postcode"],
            latitude=info["lat"],
            longitude=info["lng"],
            region="London",
        ).on_conflict_do_update(
            index_elements=["ods_code"],
            set_={
                "name": info["name"],
                "postcode": info["postcode"],
                "latitude": info["lat"],
                "longitude": info["lng"],
            },
        )
        db.execute(stmt)
    db.commit()
    print(f"Seeded {len(LONDON_TRUSTS)} providers")


def load_wait_times(db: Session, records: list[dict]) -> int:
    """Upsert wait time records into the database. Returns count loaded."""
    loaded = 0
    for rec in records:
        stmt = pg_insert(WaitTime).values(**rec).on_conflict_do_update(
            constraint="uq_wait_time_record",
            set_={
                "total_patients": rec["total_patients"],
                "within_standard": rec["within_standard"],
                "after_standard": rec["after_standard"],
                "performance": rec["performance"],
            },
        )
        db.execute(stmt)
        loaded += 1

    db.commit()
    return loaded
