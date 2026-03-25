"""Load parsed data into the database."""

from sqlalchemy.orm import Session

from app.models import Provider, WaitTime
from app.etl.london_trusts import LONDON_TRUSTS


def seed_providers(db: Session) -> None:
    """Insert or update London trust provider records."""
    for ods_code, info in LONDON_TRUSTS.items():
        existing = db.query(Provider).filter(Provider.ods_code == ods_code).first()
        if existing:
            existing.name = info["name"]
            existing.postcode = info["postcode"]
            existing.latitude = info["lat"]
            existing.longitude = info["lng"]
        else:
            db.add(Provider(
                ods_code=ods_code,
                name=info["name"],
                postcode=info["postcode"],
                latitude=info["lat"],
                longitude=info["lng"],
                region="London",
            ))
    db.commit()
    print(f"Seeded {len(LONDON_TRUSTS)} providers")


def load_wait_times(db: Session, records: list[dict]) -> int:
    """Upsert wait time records into the database. Returns count loaded."""
    loaded = 0
    for rec in records:
        existing = (
            db.query(WaitTime)
            .filter(
                WaitTime.ods_code == rec["ods_code"],
                WaitTime.period == rec["period"],
                WaitTime.standard == rec["standard"],
                WaitTime.cancer_type == rec["cancer_type"],
            )
            .first()
        )
        if existing:
            existing.total_patients = rec["total_patients"]
            existing.within_standard = rec["within_standard"]
            existing.after_standard = rec["after_standard"]
            existing.performance = rec["performance"]
        else:
            db.add(WaitTime(**rec))
        loaded += 1

    db.commit()
    return loaded
