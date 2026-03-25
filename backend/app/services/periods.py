"""Period string utilities — convert 'January 2026' to sortable dates."""

from datetime import datetime

from sqlalchemy.orm import Session

from app.models import WaitTime

MONTH_ORDER = {
    "January": 1, "February": 2, "March": 3, "April": 4,
    "May": 5, "June": 6, "July": 7, "August": 8,
    "September": 9, "October": 10, "November": 11, "December": 12,
}


def period_sort_key(period: str) -> tuple[int, int]:
    """Convert 'January 2026' to (2026, 1) for sorting."""
    parts = period.split()
    if len(parts) == 2 and parts[0] in MONTH_ORDER:
        return (int(parts[1]), MONTH_ORDER[parts[0]])
    return (0, 0)


def get_latest_period(db: Session) -> str | None:
    """Get the most recent period from the database."""
    periods = db.query(WaitTime.period).distinct().all()
    if not periods:
        return None
    period_strs = [p[0] for p in periods]
    return max(period_strs, key=period_sort_key)
