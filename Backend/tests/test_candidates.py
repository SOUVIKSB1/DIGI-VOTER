"""
Tests for Candidates and Comparison Service
"""
import pytest
from app.services.candidate_service import candidate_service

def test_candidates_list_and_pagination():
    res = candidate_service.get_all(limit=10, offset=0)
    assert res["total"] > 50
    assert len(res["candidates"]) == 10

def test_candidate_filtering():
    bjp_res = candidate_service.get_all(party="BJP", limit=20)
    assert len(bjp_res["candidates"]) > 0
    for cand in bjp_res["candidates"]:
        assert cand["party"] == "BJP"

def test_candidate_search():
    search_res = candidate_service.get_all(search="Modi")
    assert len(search_res["candidates"]) > 0
    assert any("Modi" in c["name"] for c in search_res["candidates"])

def test_candidate_comparison():
    res = candidate_service.get_all(limit=2)
    c1_id = res["candidates"][0]["id"]
    c2_id = res["candidates"][1]["id"]

    comparison = candidate_service.compare(c1_id, c2_id)
    assert comparison is not None
    assert "comparison" in comparison
    assert "win_probability_leader" in comparison["comparison"]
    assert "probability_advantage" in comparison["comparison"]

def test_candidate_comparison_invalid():
    res = candidate_service.compare("NONEXISTENT-1", "NONEXISTENT-2")
    assert res is None
