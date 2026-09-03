"""
Constituency Routes
"""
from flask import Blueprint, jsonify, request
from ..utils.data_loader import DataLoader
from ..utils.security import rate_limit, sanitize_string

constituency_bp = Blueprint("constituency", __name__)

@constituency_bp.route("/constituencies", methods=["GET"])
@rate_limit()
def get_constituencies():
    constituencies = DataLoader.get_constituencies()
    state = request.args.get("state")
    party = request.args.get("party")
    search = request.args.get("search")
    risk = request.args.get("risk")
    limit = int(request.args.get("limit", 100))
    offset = int(request.args.get("offset", 0))

    results = constituencies
    if state:
        st_clean = sanitize_string(state).lower()
        results = [c for c in results if c["state"].lower() == st_clean or c["state_code"].lower() == st_clean]
    if party:
        p_clean = sanitize_string(party).upper()
        results = [c for c in results if c["leading_party"].upper() == p_clean]
    if risk:
        r_clean = sanitize_string(risk).lower()
        results = [c for c in results if r_clean in c.get("risk_level", "").lower()]
    if search:
        s_clean = sanitize_string(search).lower()
        results = [c for c in results if s_clean in c["name"].lower() or s_clean in c["state"].lower()]

    total = len(results)
    paginated = results[offset: offset + limit]

    return jsonify({
        "total": total,
        "count": len(paginated),
        "offset": offset,
        "limit": limit,
        "constituencies": paginated
    }), 200

@constituency_bp.route("/constituencies/<string:cid>", methods=["GET"])
@rate_limit()
def get_constituency(cid):
    clean_id = sanitize_string(cid).lower()
    constituencies = DataLoader.get_constituencies()
    match = next((c for c in constituencies if c["id"].lower() == clean_id or c["name"].lower() == clean_id), None)
    if not match:
        return jsonify({"error": f"Constituency '{cid}' not found", "status": 404}), 404
    return jsonify(match), 200

@constituency_bp.route("/states/<string:state_name>", methods=["GET"])
@rate_limit()
def get_state_detail(state_name):
    clean_st = sanitize_string(state_name).lower()
    constituencies = DataLoader.get_constituencies()
    matches = [c for c in constituencies if c["state"].lower() == clean_st or c["state_code"].lower() == clean_st]
    if not matches:
        return jsonify({"error": f"State '{state_name}' not found", "status": 404}), 404

    party_tally = {}
    turnout_sum = 0
    battleground_count = 0
    for c in matches:
        p = c["leading_party"]
        party_tally[p] = party_tally.get(p, 0) + 1
        turnout_sum += float(c.get("turnout_2024", 60.0))
        if float(c.get("predicted_margin", 10.0)) < 5.0:
            battleground_count += 1

    return jsonify({
        "state": matches[0]["state"],
        "state_code": matches[0]["state_code"],
        "total_seats": len(matches),
        "party_breakdown": party_tally,
        "average_turnout": round(turnout_sum / len(matches), 1),
        "battleground_seats_count": battleground_count,
        "constituencies": matches
    }), 200
