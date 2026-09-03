"""
Tests for Dashboard and Analytics Service
"""
import pytest
from app.services.analytics_service import analytics_service

def test_dashboard_overview():
    overview = analytics_service.get_dashboard_overview()
    assert overview["total_seats"] == 543
    assert overview["majority_mark"] == 272
    assert "leading_party" in overview
    assert "leading_alliance" in overview
    assert "closest_contests_count" in overview
    assert overview["closest_contests_count"] > 0
    assert "avg_prediction_confidence" in overview
    assert overview["avg_prediction_confidence"] > 50.0

def test_alliance_total_matches_543():
    overview = analytics_service.get_dashboard_overview()
    alliance_sum = sum(overview["alliance_breakdown"].values())
    assert alliance_sum == 543

def test_party_total_matches_543():
    overview = analytics_service.get_dashboard_overview()
    party_sum = sum(overview["party_breakdown"].values())
    assert party_sum == 543

def test_scenarios_count():
    scenarios = analytics_service.get_swing_scenarios()
    assert len(scenarios) >= 4
    for s in scenarios:
        assert s["nda_seats"] + s["india_seats"] + s["others_seats"] == 543
