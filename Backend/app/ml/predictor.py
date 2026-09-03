"""
Multi-Model Ensemble Election Predictor
Integrates Random Forest, Gradient Boosting, Logistic Regression, and Probability Calibration.
"""
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from .preprocessing import ElectionFeaturePreprocessor, FEATURE_NAMES

class ElectionEnsemblePredictor:
    def __init__(self):
        self.preprocessor = ElectionFeaturePreprocessor()
        self.rf_model = None
        self.gb_model = None
        self.lr_model = None
        self.calibrated_ensemble = None
        self.classes_ = None
        self.is_trained = False

    def train(self, constituencies):
        """
        Train ensemble on historical/constituency training set.
        Target: Winner party classification.
        """
        X = self.preprocessor.fit_transform(constituencies)
        y = np.array([c["winner_2024"] for c in constituencies])

        # Filter classes with at least 2 samples to allow proper calibration and cross-validation
        unique_classes, counts = np.unique(y, return_counts=True)
        rare_classes = set(unique_classes[counts < 2])
        y_adjusted = np.array([cls if cls not in rare_classes else "OTH" for cls in y])

        self.classes_ = np.unique(y_adjusted)

        # 1. Random Forest
        self.rf_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=6,
            random_state=42,
            min_samples_split=3
        )
        self.rf_model.fit(X, y_adjusted)

        # 2. Gradient Boosting
        self.gb_model = GradientBoostingClassifier(
            n_estimators=75,
            learning_rate=0.08,
            max_depth=4,
            random_state=42
        )
        self.gb_model.fit(X, y_adjusted)

        # 3. Logistic Regression
        self.lr_model = LogisticRegression(
            max_iter=500,
            C=1.0,
            random_state=42
        )
        self.lr_model.fit(X, y_adjusted)

        # 4. Soft Voting Ensemble
        voting_clf = VotingClassifier(
            estimators=[
                ("rf", self.rf_model),
                ("gb", self.gb_model),
                ("lr", self.lr_model)
            ],
            voting="soft",
            weights=[0.40, 0.40, 0.20]
        )
        voting_clf.fit(X, y_adjusted)

        # 5. Probability Calibration
        try:
            self.calibrated_ensemble = CalibratedClassifierCV(
                estimator=voting_clf,
                method="sigmoid",
                cv="prefit"
            )
            self.calibrated_ensemble.fit(X, y_adjusted)
        except Exception:
            self.calibrated_ensemble = voting_clf

        self.is_trained = True

    def predict_single(self, c_record, swing_pct=0.0):
        """
        Produce a calibrated multi-model prediction for a single constituency record.
        """
        if not self.is_trained:
            raise RuntimeError("Predictor is not trained yet.")

        # Base feature inference
        X_transformed = self.preprocessor.transform([c_record])

        # Raw probabilities from each component model
        rf_probs = self.rf_model.predict_proba(X_transformed)[0]
        gb_probs = self.gb_model.predict_proba(X_transformed)[0]
        lr_probs = self.lr_model.predict_proba(X_transformed)[0]
        ens_probs = self.calibrated_ensemble.predict_proba(X_transformed)[0].copy()

        top_idx = int(np.argmax(ens_probs))
        winner_party = self.classes_[top_idx]

        # Apply swing adjustment directly to calibrated probabilities
        if swing_pct != 0.0:
            swing_boost = swing_pct * 0.018
            ens_probs[top_idx] = np.clip(ens_probs[top_idx] + swing_boost, 0.05, 0.98)
            # Normalize probabilities
            ens_probs = ens_probs / np.sum(ens_probs)

        # Sort all class probabilities
        sorted_indices = np.argsort(ens_probs)[::-1]
        breakdown = []
        for idx in sorted_indices:
            party = self.classes_[idx]
            p_val = round(float(ens_probs[idx]) * 100, 1)
            if p_val > 0.5:
                breakdown.append({"party": party, "probability": p_val})

        # Calculate runner up & margin
        lead_prob_pct = breakdown[0]["probability"]
        runner_up = self.classes_[sorted_indices[1]] if len(sorted_indices) > 1 else "OTH"
        runner_prob_pct = breakdown[1]["probability"] if len(breakdown) > 1 else 0.0
        pred_margin = round(lead_prob_pct - runner_prob_pct, 1)

        # Risk tier & confidence
        if pred_margin < 5.0 or lead_prob_pct < 55.0:
            risk_level = "High (Battleground)"
            confidence = "Low"
        elif pred_margin < 12.0:
            risk_level = "Competitive"
            confidence = "Medium"
        else:
            risk_level = "Low"
            confidence = "High"

        return {
            "constituency_id": c_record.get("id"),
            "constituency_name": c_record.get("name"),
            "state": c_record.get("state"),
            "predicted_winner": winner_party,
            "runner_up": runner_up,
            "win_probability": lead_prob_pct,
            "predicted_margin": pred_margin,
            "model_confidence": confidence,
            "risk_level": risk_level,
            "probability_breakdown": breakdown,
            "ensemble_scores": {
                "RandomForest": round(float(np.max(rf_probs)) * 100, 1),
                "GradientBoosting": round(float(np.max(gb_probs)) * 100, 1),
                "LogisticRegression": round(float(np.max(lr_probs)) * 100, 1),
                "CalibratedEnsemble": lead_prob_pct
            }
        }
