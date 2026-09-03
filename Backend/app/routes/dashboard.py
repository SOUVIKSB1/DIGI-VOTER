"""
Dashboard & Analytics Routes
"""
from flask import Blueprint, jsonify, request
from ..services.analytics_service import analytics_service
from ..utils.data_loader import DataLoader
from ..utils.security import rate_limit

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/analytics", methods=["GET"])
@rate_limit()
def get_analytics():
    overview = analytics_service.get_dashboard_overview()
    return jsonify(overview), 200

@dashboard_bp.route("/elections", methods=["GET"])
@rate_limit()
def get_elections():
    return jsonify({
        "elections": [
            {
                "id": "LS-2024-2026",
                "name": "18th Lok Sabha General Election & Projections",
                "cycle": "2024-2026",
                "total_seats": 543,
                "majority_threshold": 272,
                "status": "Active Forecast"
            },
            {
                "id": "LS-2019",
                "name": "17th Lok Sabha General Election (Historical)",
                "cycle": "2019",
                "total_seats": 543,
                "majority_threshold": 272,
                "status": "Historical Benchmark"
            }
        ]
    }), 200

@dashboard_bp.route("/scenarios", methods=["GET"])
@rate_limit()
def get_scenarios():
    scenarios = analytics_service.get_swing_scenarios()
    return jsonify({"scenarios": scenarios}), 200

@dashboard_bp.route("/states", methods=["GET"])
@rate_limit()
def get_states():
    constituencies = DataLoader.get_constituencies()
    state_map = {}
    for c in constituencies:
        st = c["state"]
        code = c["state_code"]
        if st not in state_map:
            state_map[st] = {
                "state": st,
                "state_code": code,
                "total_seats": 0,
                "parties_leading": {}
            }
        state_map[st]["total_seats"] += 1
        p = c["leading_party"]
        state_map[st]["parties_leading"][p] = state_map[st]["parties_leading"].get(p, 0) + 1

    return jsonify({"states": list(state_map.values())}), 200
