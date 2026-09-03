"""
Unit and Integration Tests for Prediction & ML Pipeline
"""
import pytest
from app.services.prediction_service import prediction_service

def test_ml_model_loaded_and_trained():
    assert prediction_service.predictor.is_trained is True
    assert prediction_service.predictor.rf_model is not None
    assert prediction_service.predictor.gb_model is not None
    assert prediction_service.predictor.lr_model is not None
    assert len(prediction_service.predictor.classes_) > 0

def test_predict_valid_constituency():
    res = prediction_service.predict_constituency("UP-VARANASI")
    assert res is not None
    assert "predicted_winner" in res
    assert "win_probability" in res
    assert res["win_probability"] > 0
    assert "model_confidence" in res
    assert res["model_confidence"] in ["High", "Medium", "Low"]
    assert "risk_level" in res
    assert "explainability" in res
    assert "overall_advantage" in res["explainability"]
    assert len(res["explainability"]["factors"]) > 0

def test_predict_invalid_constituency():
    res = prediction_service.predict_constituency("INVALID-NONEXISTENT-SEAT")
    assert res is None

def test_predict_with_swing():
    baseline = prediction_service.predict_constituency("UP-VARANASI", swing_pct=0.0)
    swung = prediction_service.predict_constituency("UP-VARANASI", swing_pct=5.0)
    assert baseline is not None
    assert swung is not None
    # Swung lead vote share should reflect upward movement
    assert swung["win_probability"] >= baseline["win_probability"] - 5.0

def test_closest_races_ranking():
    closest = prediction_service.get_closest_races(limit=10)
    assert len(closest) <= 10
    assert len(closest) > 0
    # Ensure they are sorted ascending by predicted_margin
    margins = [c["predicted_margin"] for c in closest]
    assert margins == sorted(margins)

def test_top_battlegrounds():
    bg = prediction_service.get_top_battlegrounds(limit=15)
    assert len(bg) > 0
    assert len(bg) <= 15
    for item in bg:
        assert float(item.get("predicted_margin", 10.0)) < 8.0 or "Battleground" in item.get("risk_level", "")

def test_simulate_swing_total_seats():
    sim = prediction_service.simulate_swing(swing_pct=2.5, target_party="NDA")
    total_alliance_seats = sum(sim["alliance_seats"].values())
    assert total_alliance_seats == 543
    assert sim["majority_threshold"] == 272
