"""
AI Election Analyst Routes
"""
from flask import Blueprint, jsonify, request
from ..services.ai_analyst_service import ai_analyst_service
from ..utils.security import rate_limit, sanitize_string

ai_analyst_bp = Blueprint("ai_analyst", __name__)

@ai_analyst_bp.route("/ai/query", methods=["POST", "GET"])
@rate_limit()
def query_ai_analyst():
    if request.method == "POST":
        payload = request.get_json(silent=True) or {}
        query = payload.get("query", "")
    else:
        query = request.args.get("q", "")

    cleaned_query = sanitize_string(query, max_len=250)
    if not cleaned_query:
        return jsonify({
            "error": "Query parameter cannot be empty.",
            "status": 400
        }), 400

    response = ai_analyst_service.answer_query(cleaned_query)
    return jsonify(response), 200
