"""Provider endpoints: list and detail."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Provider, WaitTime
from app.etl.london_trusts import CANCER_TYPE_DISPLAY

router = APIRouter(tags=["providers"])


@router.get("/providers")
def list_providers(db: Session = Depends(get_db)):
    """List all London cancer treatment providers."""
    providers = db.query(Provider).order_by(Provider.name).all()
    return [
        {
            "ods_code": p.ods_code,
            "name": p.name,
            "postcode": p.postcode,
            "latitude": p.latitude,
            "longitude": p.longitude,
        }
        for p in providers
    ]


@router.get("/providers/{ods_code}")
def get_provider(ods_code: str, db: Session = Depends(get_db)):
    """Get provider detail with all wait time data."""
    provider = db.query(Provider).filter(Provider.ods_code == ods_code.upper()).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # Get all wait time records for this provider
    wait_times = (
        db.query(WaitTime)
        .filter(WaitTime.ods_code == provider.ods_code)
        .order_by(WaitTime.period.desc(), WaitTime.standard, WaitTime.cancer_type)
        .all()
    )

    # Group by period then standard
    periods: dict[str, dict] = {}
    for wt in wait_times:
        if wt.period not in periods:
            periods[wt.period] = {}
        period_data = periods[wt.period]

        if wt.standard not in period_data:
            period_data[wt.standard] = []

        period_data[wt.standard].append({
            "cancer_type": wt.cancer_type,
            "display_name": CANCER_TYPE_DISPLAY.get(wt.cancer_type, wt.cancer_type),
            "total_patients": wt.total_patients,
            "within_standard": wt.within_standard,
            "after_standard": wt.after_standard,
            "performance": wt.performance,
        })

    return {
        "ods_code": provider.ods_code,
        "name": provider.name,
        "postcode": provider.postcode,
        "latitude": provider.latitude,
        "longitude": provider.longitude,
        "wait_times": periods,
    }


@router.get("/cancer-types")
def list_cancer_types(db: Session = Depends(get_db)):
    """List cancer types available for search (FDS referral pathway types)."""
    types = (
        db.query(WaitTime.cancer_type, WaitTime.standard)
        .filter(
            WaitTime.cancer_type != "ALL CANCERS",
            WaitTime.cancer_type != "Missing or Invalid",
            WaitTime.cancer_type.notlike("Exhibited%"),
            WaitTime.standard == "FDS",
        )
        .distinct()
        .all()
    )

    result = {}
    for cancer_type, standard in types:
        display = CANCER_TYPE_DISPLAY.get(cancer_type, cancer_type)
        if cancer_type not in result:
            result[cancer_type] = {
                "value": cancer_type,
                "display_name": display,
                "standards": [],
            }
        result[cancer_type]["standards"].append(standard)

    return sorted(result.values(), key=lambda x: x["display_name"])
