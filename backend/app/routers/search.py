"""Search API: ranked providers by cancer type + location."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Provider, WaitTime
from app.services.geocoding import geocode_postcode
from app.services.ranking import rank_providers
from app.services.periods import get_latest_period

router = APIRouter(tags=["search"])


@router.get("/search")
async def search(
    cancer_type: str = Query(..., description="Cancer type to search for"),
    postcode: str | None = Query(None, description="UK postcode for distance calculation"),
    lat: float | None = Query(None, description="Latitude (alternative to postcode)"),
    lng: float | None = Query(None, description="Longitude (alternative to postcode)"),
    db: Session = Depends(get_db),
):
    """Search for London trusts by cancer type and location, ranked by wait time + distance."""

    # Resolve user location: prefer lat/lng if provided, otherwise geocode postcode
    if lat is not None and lng is not None:
        user_lat, user_lng = lat, lng
    elif postcode:
        try:
            user_lat, user_lng = await geocode_postcode(postcode, db)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid postcode: {postcode}")
    else:
        raise HTTPException(status_code=400, detail="Provide either a postcode or lat/lng coordinates")

    # Get the latest period in the database
    latest_period = get_latest_period(db)
    if not latest_period:
        raise HTTPException(status_code=503, detail="No data loaded. Run ETL first.")

    # Query wait times for this cancer type across all London providers
    wait_data = (
        db.query(WaitTime)
        .filter(
            WaitTime.period == latest_period,
            WaitTime.cancer_type == cancer_type,
        )
        .all()
    )

    # Fallback to ALL CANCERS
    if not wait_data:
        wait_data = (
            db.query(WaitTime)
            .filter(
                WaitTime.period == latest_period,
                WaitTime.cancer_type == "ALL CANCERS",
            )
            .all()
        )

    if not wait_data:
        raise HTTPException(status_code=404, detail=f"No data found for cancer type: {cancer_type}")

    # Group by provider
    provider_metrics: dict[str, dict] = {}
    for wt in wait_data:
        if wt.ods_code not in provider_metrics:
            provider_metrics[wt.ods_code] = {}
        pm = provider_metrics[wt.ods_code]
        if wt.standard == "62D":
            pm["performance_62d"] = wt.performance
            pm["total_patients_62d"] = wt.total_patients
        elif wt.standard == "31D":
            pm["performance_31d"] = wt.performance
        elif wt.standard == "FDS":
            pm["performance_fds"] = wt.performance

    # Get provider info
    providers_db = (
        db.query(Provider)
        .filter(Provider.ods_code.in_(provider_metrics.keys()))
        .all()
    )

    provider_list = []
    for p in providers_db:
        metrics = provider_metrics.get(p.ods_code, {})
        provider_list.append({
            "ods_code": p.ods_code,
            "name": p.name,
            "lat": p.latitude,
            "lng": p.longitude,
            **metrics,
        })

    # Rank
    ranked = rank_providers(provider_list, user_lat, user_lng)

    return {
        "postcode": postcode or "GPS location",
        "cancer_type": cancer_type,
        "period": latest_period,
        "user_location": {"lat": user_lat, "lng": user_lng},
        "results": [
            {
                "rank": i + 1,
                "ods_code": r.ods_code,
                "name": r.name,
                "lat": r.lat,
                "lng": r.lng,
                "distance_km": r.distance_km,
                "performance_62d": r.performance_62d,
                "performance_31d": r.performance_31d,
                "performance_fds": r.performance_fds,
                "total_patients_62d": r.total_patients_62d,
                "score": r.score,
            }
            for i, r in enumerate(ranked)
        ],
    }
