"""
Candidate Routes
"""
from flask import Blueprint, jsonify, request
from ..services.candidate_service import candidate_service
from ..utils.security import rate_limit, sanitize_string

candidate_bp = Blueprint("candidate", __name__)

@candidate_bp.route("/candidates", methods=["GET"])
@rate_limit()
def get_candidates():
    party = request.args.get("party")
    state = request.args.get("state")
    search = request.args.get("search")
    limit = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))

    data = candidate_service.get_all(
        party=party,
        state=state,
        search=search,
        limit=limit,
        offset=offset
    )
    return jsonify(data), 200

@candidate_bp.route("/candidates/<string:cand_id>", methods=["GET"])
@rate_limit()
def get_candidate(cand_id):
    clean_id = sanitize_string(cand_id)
    cand = candidate_service.get_by_id(clean_id)
    if not cand:
        return jsonify({"error": f"Candidate '{cand_id}' not found", "status": 404}), 404
    return jsonify(cand), 200

@candidate_bp.route("/candidates/compare", methods=["GET", "POST"])
@rate_limit()
def compare_candidates():
    if request.method == "POST":
        payload = request.get_json(silent=True) or {}
        id1 = sanitize_string(payload.get("candidate_1_id", ""))
        id2 = sanitize_string(payload.get("candidate_2_id", ""))
    else:
        id1 = sanitize_string(request.args.get("c1", ""))
        id2 = sanitize_string(request.args.get("c2", ""))

    if not id1 or not id2:
        return jsonify({"error": "Both candidate IDs (c1, c2) are required for comparison", "status": 400}), 400

    comp = candidate_service.compare(id1, id2)
    if not comp:
        return jsonify({"error": "One or both candidate IDs could not be found", "status": 404}), 404

    return jsonify(comp), 200
