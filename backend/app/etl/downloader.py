"""Download NHS Cancer Waiting Times CSV files."""

import httpx

# Known CSV URLs for the latest available periods
NHS_CSV_URLS = [
    (
        "January 2026",
        "https://www.england.nhs.uk/statistics/wp-content/uploads/sites/2/2026/03/January-2026-Monthly-Combined-CSV-Provisional.csv",
    ),
    (
        "December 2025",
        "https://www.england.nhs.uk/statistics/wp-content/uploads/sites/2/2026/02/December-2025-Monthly-Combined-CSV-Provisional.csv",
    ),
    (
        "November 2025",
        "https://www.england.nhs.uk/statistics/wp-content/uploads/sites/2/2026/01/November-2025-Monthly-Combined-CSV-Provisional.csv",
    ),
    (
        "October 2025",
        "https://www.england.nhs.uk/statistics/wp-content/uploads/sites/2/2025/12/October-2025-Monthly-Combined-Workbook-Provisional.xlsx",
    ),
]


def download_csv(url: str, timeout: float = 60.0) -> str:
    """Download a CSV file and return its content as a string."""
    resp = httpx.get(url, timeout=timeout, follow_redirects=True)
    resp.raise_for_status()
    return resp.text


def download_latest(n: int = 3) -> list[tuple[str, str]]:
    """Download the latest N CSV files. Returns list of (period, csv_text)."""
    results = []
    for period, url in NHS_CSV_URLS[:n]:
        if url.endswith(".xlsx"):
            continue  # Skip XLSX files, only process CSVs
        try:
            csv_text = download_csv(url)
            results.append((period, csv_text))
            print(f"Downloaded {period}")
        except httpx.HTTPError as e:
            print(f"Failed to download {period}: {e}")
    return results
