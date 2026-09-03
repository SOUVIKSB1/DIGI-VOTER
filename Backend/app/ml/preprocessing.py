"""
Feature Engineering & Preprocessing for Election Intelligence Models
"""
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

FEATURE_NAMES = [
    "historical_vote_share",
    "turnout_momentum",
    "incumbency_advantage",
    "literacy_factor",
    "demographic_urban_density",
    "prior_victory_margin",
    "state_swing_index"
]

class ElectionFeaturePreprocessor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.is_fitted = False

    def extract_features(self, records):
        """
        Extract numerical feature matrix from raw constituency dictionary records.
        """
        rows = []
        for c in records:
            # Turnout momentum
            t_mom = float(c.get("turnout_2024", 60.0)) - float(c.get("turnout_2019", 60.0))
            
            # Incumbency
            incumbent = 1.0 if c.get("winner_2019") == c.get("winner_2024") else -0.5

            # Demo type
            demo = c.get("demographic_type", "Rural")
            demo_val = 1.0 if demo == "Urban" else (0.5 if demo == "Semi-Urban" else 0.0)

            # Prior margin
            prior_margin = float(c.get("margin_pct_2019", 5.0))

            # Vote share lead estimate
            hist_vote_share = float(c.get("projected_vote_share_lead", 48.0))

            # Literacy
            lit = float(c.get("literacy_rate", 70.0)) / 100.0

            # State swing index (synthetic baseline derived from turnout shift & margin)
            state_swing = float(c.get("past_swing", 0.0)) * 0.45

            rows.append([
                hist_vote_share,
                t_mom,
                incumbent,
                lit,
                demo_val,
                prior_margin,
                state_swing
            ])

        return np.array(rows, dtype=np.float32)

    def fit_transform(self, records):
        X = self.extract_features(records)
        X_scaled = self.scaler.fit_transform(X)
        self.is_fitted = True
        return X_scaled

    def transform(self, records):
        X = self.extract_features(records)
        if not self.is_fitted:
            return X
        return self.scaler.transform(X)
