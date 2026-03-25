"""Stats and ETL management endpoints."""

from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Provider, WaitTime
from app.services.periods import get_latest_period

router = APIRouter(tags=["stats"])


@router.get("/stats/summary")
def summary_stats(db: Session = Depends(get_db)):
    """Aggregate statistics across all London providers."""
    latest_period = get_latest_period(db)
    if not latest_period:
        return {"error": "No data loaded"}

    provider_count = db.query(Provider).count()

    # Average performance by standard
    standards = {}
    for std in ["FDS", "31D", "62D"]:
        avg = (
            db.query(func.avg(WaitTime.performance))
            .filter(WaitTime.period == latest_period, WaitTime.standard == std)
            .scalar()
        )
        if avg is not None:
            standards[std] = round(float(avg), 4)

    # Cancer types with data
    cancer_type_count = (
        db.query(WaitTime.cancer_type)
        .filter(WaitTime.period == latest_period, WaitTime.cancer_type != "ALL CANCERS")
        .distinct()
        .count()
    )

    # Total records
    total_records = db.query(WaitTime).filter(WaitTime.period == latest_period).count()

    return {
        "period": latest_period,
        "provider_count": provider_count,
        "cancer_type_count": cancer_type_count,
        "total_records": total_records,
        "average_performance": standards,
    }


@router.post("/etl/refresh")
def trigger_refresh(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Trigger a background ETL refresh."""
    from app.etl.run import run_etl

    background_tasks.add_task(run_etl, 3)
    return {"status": "ETL refresh started in background"}
