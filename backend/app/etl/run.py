"""CLI entry point: python -m app.etl.run"""

from app.database import SessionLocal, engine, Base
from app.etl.downloader import download_latest
from app.etl.parser import parse_csv
from app.etl.loader import seed_providers, load_wait_times


def run_etl(num_periods: int = 3) -> None:
    """Run the full ETL pipeline: download → parse → load."""
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Seed provider reference data
        seed_providers(db)

        # Download and process CSV files
        csv_files = download_latest(n=num_periods)
        total_loaded = 0

        for period, csv_text in csv_files:
            records = parse_csv(csv_text, period)
            loaded = load_wait_times(db, records)
            total_loaded += loaded
            print(f"  {period}: {loaded} records loaded")

        print(f"\nETL complete. Total records loaded: {total_loaded}")
    finally:
        db.close()


if __name__ == "__main__":
    run_etl()
