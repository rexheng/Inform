"""Parse NHS Cancer Waiting Times CSV data."""

import io

import pandas as pd

from app.etl.london_trusts import LONDON_ODS_CODES


def parse_csv(csv_text: str, period: str) -> list[dict]:
    """Parse a combined CSV and extract London provider data.

    Returns a list of dicts ready for database insertion:
    {ods_code, period, standard, cancer_type, total_patients,
     within_standard, after_standard, performance}
    """
    df = pd.read_csv(io.StringIO(csv_text), dtype=str)

    # Strip quotes from all string columns
    for col in df.columns:
        if df[col].dtype == object:
            df[col] = df[col].str.strip('"').str.strip()

    # Filter: Provider basis only, London trusts only
    df = df[df["Basis"] == "Provider"]
    df = df[df["Org_Code"].isin(LONDON_ODS_CODES)]

    # Filter to summary rows: ALL ROUTES for FDS, ALL STAGES for 31D/62D
    # Also ALL MODALITIES for 31D/62D
    mask_fds = (df["Standard_or_Item"] == "FDS") & (df["Referral_Route_or_Stage"] == "ALL ROUTES")
    mask_31d = (
        (df["Standard_or_Item"] == "31D")
        & (df["Referral_Route_or_Stage"] == "First Treatment")
        & (df["Treatment_Modality"] == "ALL MODALITIES")
    )
    mask_62d = (
        (df["Standard_or_Item"] == "62D")
        & (df["Referral_Route_or_Stage"] == "ALL ROUTES")
        & (df["Treatment_Modality"] == "ALL MODALITIES")
    )
    df = df[mask_fds | mask_31d | mask_62d]

    # Exclude ALL CANCERS aggregate — keep individual cancer types only
    df = df[df["Cancer_Type"] != "ALL CANCERS"]

    records = []
    for _, row in df.iterrows():
        total = _safe_int(row.get("Total", "0"))
        within = _safe_int(row.get("Within", "0"))
        after = _safe_int(row.get("After", "0"))
        perf = _safe_float(row.get("Performance", "0"))

        records.append({
            "ods_code": row["Org_Code"],
            "period": period,
            "standard": row["Standard_or_Item"],
            "cancer_type": row["Cancer_Type"],
            "total_patients": total,
            "within_standard": within,
            "after_standard": after,
            "performance": perf,
        })

    return records


def _safe_int(val: str) -> int:
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return 0


def _safe_float(val: str) -> float:
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0.0
