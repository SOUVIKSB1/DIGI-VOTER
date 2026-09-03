"""
Tests for Constituency Records and State Aggregation
"""
import pytest
from app.utils.data_loader import DataLoader

def test_constituencies_count():
    data = DataLoader.get_constituencies()
    assert len(data) == 543

def test_constituency_fields():
    data = DataLoader.get_constituencies()
    first = data[0]
    expected_keys = [
        "id", "name", "state", "state_code", "electors",
        "demographic_type", "winner_2019", "winner_2024",
        "leading_party", "runner_up_party", "win_probability",
        "predicted_margin", "risk_level"
    ]
    for k in expected_keys:
        assert k in first, f"Missing key {k} in constituency data"

def test_states_coverage():
    data = DataLoader.get_constituencies()
    states = {c["state"] for c in data}
    assert "Uttar Pradesh" in states
    assert "Maharashtra" in states
    assert "West Bengal" in states
    assert "Tamil Nadu" in states
    assert "Kerala" in states
    assert "Gujarat" in states
    assert len(states) >= 30
