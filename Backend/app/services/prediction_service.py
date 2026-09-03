"""
Prediction Service
Orchestrates model inference, swing calculations, and battleground rankings.
"""
from ..ml.predictor import ElectionEnsemblePredictor
from ..ml.explainability import ElectionExplainer
from ..ml.evaluation import ElectionModelEvaluator
from ..utils.data_loader import DataLoader

class PredictionService:
    def __init__(self):
        self.predictor = ElectionEnsemblePredictor()
        self.explainer = ElectionExplainer(self.predictor)
        self.evaluator = ElectionModelEvaluator(self.predictor)
        self._initialize()

    def _initialize(self):
        constituencies = DataLoader.get_constituencies()
        self.predictor.train(constituencies)
        # Precompute evaluation metrics
        self.evaluator.evaluate(constituencies)

    def predict_constituency(self, cid, swing_pct=0.0):
        constituencies = DataLoader.get_constituencies()
        match = next((c for c in constituencies if c["id"].lower() == cid.lower()), None)
        if not match:
            # Fallback search by name
            match = next((c for c in constituencies if c["name"].lower() == cid.lower()), None)
        if not match:
            return None

        pred = self.predictor.predict_single(match, swing_pct=swing_pct)
        explanation = self.explainer.explain_constituency(match, pred)
        pred["explainability"] = explanation
        pred["raw_constituency"] = match
        return pred

    def get_closest_races(self, limit=15):
        constituencies = DataLoader.get_constituencies()
        # Sort by smallest predicted margin
        sorted_seats = sorted(constituencies, key=lambda c: float(c.get("predicted_margin", 99.0)))
        results = []
        for c in sorted_seats[:limit]:
            results.append({
                "id": c["id"],
                "name": c["name"],
                "state": c["state"],
                "leading_party": c["leading_party"],
                "runner_up_party": c["runner_up_party"],
                "predicted_margin": c["predicted_margin"],
                "win_probability": c["win_probability"],
                "risk_level": c["risk_level"],
                "demographic_type": c["demographic_type"]
            })
        return results

    def get_top_battlegrounds(self, state=None, limit=20):
        constituencies = DataLoader.get_constituencies()
        filtered = constituencies
        if state:
            filtered = [c for c in constituencies if c["state"].lower() == state.lower() or c["state_code"].lower() == state.lower()]

        # Battlegrounds defined by margin < 6.0% or risk_level == "High (Battleground)"
        bg = [c for c in filtered if float(c.get("predicted_margin", 10.0)) < 6.0 or "Battleground" in c.get("risk_level", "")]
        bg_sorted = sorted(bg, key=lambda c: float(c.get("predicted_margin", 99.0)))
        return bg_sorted[:limit]

    def simulate_swing(self, swing_pct=0.0, target_party="NDA"):
        """
        Apply national or alliance swing across all 543 constituencies and tally projected seats.
        """
        constituencies = DataLoader.get_constituencies()
        parties = DataLoader.get_parties()
        party_alliance_map = {p["id"]: p["alliance"] for p in parties}

        seat_counts = {}
        alliance_counts = {"NDA": 0, "INDIA": 0, "OTHERS": 0}

        for c in constituencies:
            # Baseline leader
            lead = c["leading_party"]
            lead_alliance = party_alliance_map.get(lead, "OTHERS")
            margin = float(c.get("predicted_margin", 5.0))

            # If swing is positive toward NDA and current leader is not NDA, flip if swing > margin
            projected_winner = lead
            if target_party == "NDA" and swing_pct > 0:
                if lead_alliance != "NDA" and swing_pct >= margin:
                    projected_winner = "BJP" if c["state_code"] not in ["AP", "MH", "BR"] else c.get("runner_up_party", "BJP")
            elif target_party == "INDIA" and swing_pct > 0:
                if lead_alliance != "INDIA" and swing_pct >= margin:
                    projected_winner = "INC" if c["state_code"] not in ["UP", "WB", "TN"] else c.get("runner_up_party", "INC")

            seat_counts[projected_winner] = seat_counts.get(projected_winner, 0) + 1
            proj_alliance = party_alliance_map.get(projected_winner, "OTHERS")
            alliance_counts[proj_alliance] += 1

        return {
            "swing_pct": swing_pct,
            "target_alliance": target_party,
            "alliance_seats": alliance_counts,
            "party_seats": seat_counts,
            "majority_threshold": 272,
            "total_seats": len(constituencies)
        }

# Singleton instance
prediction_service = PredictionService()
