"""
HTTP API Integration and Route Tests
"""
import pytest
from app import create_app

@pytest.fixture
def client():
    app = create_app("testing")
    with app.test_client() as client:
        yield client

def test_api_health(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert "VoteVision" in data["service"]

def test_security_headers_present(client):
    res = client.get("/api/v1/health")
    assert "X-Content-Type-Options" in res.headers
    assert res.headers["X-Content-Type-Options"] == "nosniff"
    assert "X-Frame-Options" in res.headers

def test_get_constituencies_api(client):
    res = client.get("/api/v1/constituencies?limit=5")
    assert res.status_code == 200
    data = res.get_json()
    assert data["total"] == 543
    assert len(data["constituencies"]) == 5

def test_get_single_constituency_api(client):
    res = client.get("/api/v1/constituencies/UP-VARANASI")
    assert res.status_code == 200
    data = res.get_json()
    assert data["name"] == "Varanasi"

def test_get_invalid_constituency_api(client):
    res = client.get("/api/v1/constituencies/INVALID-SEAT-XYZ")
    assert res.status_code == 404
    data = res.get_json()
    assert data["status"] == 404

def test_get_prediction_api(client):
    res = client.get("/api/v1/predictions/UP-VARANASI")
    assert res.status_code == 200
    data = res.get_json()
    assert "predicted_winner" in data
    assert "win_probability" in data
    assert "explainability" in data

def test_closest_races_api(client):
    res = client.get("/api/v1/predictions/closest-races")
    assert res.status_code == 200
    data = res.get_json()
    assert "closest_races" in data
    assert len(data["closest_races"]) > 0

def test_top_battlegrounds_api(client):
    res = client.get("/api/v1/predictions/top-battlegrounds")
    assert res.status_code == 200
    data = res.get_json()
    assert "battlegrounds" in data

def test_candidates_api(client):
    res = client.get("/api/v1/candidates?limit=10")
    assert res.status_code == 200
    data = res.get_json()
    assert "candidates" in data

def test_candidate_comparison_api_missing_param(client):
    res = client.get("/api/v1/candidates/compare")
    assert res.status_code == 400

def test_parties_api(client):
    res = client.get("/api/v1/parties")
    assert res.status_code == 200
    data = res.get_json()
    assert "parties" in data

def test_single_party_api(client):
    res = client.get("/api/v1/parties/BJP")
    assert res.status_code == 200
    data = res.get_json()
    assert data["id"] == "BJP"
    assert "leading_seats_count" in data

def test_invalid_party_api(client):
    res = client.get("/api/v1/parties/UNKNOWNPARTYXYZ")
    assert res.status_code == 404

def test_model_metrics_api(client):
    res = client.get("/api/v1/model/metrics")
    assert res.status_code == 200
    data = res.get_json()
    assert "summary" in data
    assert "model_comparison" in data

def test_ai_analyst_query_api(client):
    res = client.post("/api/v1/ai/query", json={"query": "Which states have the closest contests?"})
    assert res.status_code == 200
    data = res.get_json()
    assert "answer" in data
    assert "grounded_sources" in data

def test_ai_analyst_empty_query(client):
    res = client.post("/api/v1/ai/query", json={"query": ""})
    assert res.status_code == 400
