"""
Historical Dataset Connector.
Loads historical meteorological records for model training, calibration, and retrospective testing.
"""

from datetime import date
from typing import List, Optional
import pandas as pd
import os

from app.schemas.contracts import Observation


class HistoricalDatasetConnector:
    """
    Historical observation and reanalysis dataset loader.
    Supports CSV/Parquet archives of IMD AWS/ARG observations.
    """

    def __init__(self, data_dir: Optional[str] = None):
        self.data_dir = data_dir or os.path.join(os.path.dirname(__file__), "../../../../ml/data")

    def load_historical_observations(
        self,
        station_id: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> pd.DataFrame:
        """Load historical daily ground observations dataframe."""
        filepath = os.path.join(self.data_dir, "processed", "historical_observations.csv")
        if not os.path.exists(filepath):
            return pd.DataFrame()

        df = pd.read_csv(filepath, parse_dates=["date"])
        if station_id:
            df = df[df["station_id"] == station_id]
        if start_date:
            df = df[df["date"] >= pd.Timestamp(start_date)]
        if end_date:
            df = df[df["date"] <= pd.Timestamp(end_date)]
        return df
