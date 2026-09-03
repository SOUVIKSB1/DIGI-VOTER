"""
Prediction Routes
"""
from flask import Blueprint, jsonify, request
from ..services.prediction_service import prediction_service
from ..utils.security import rate_limit, sanitize_string

prediction_bp = Blueprint("prediction", __name__)

@prediction_bp.route("/predictions", methods=["GET"])
@rate_limit()
def get_all_predictions():
    # Return quick summary of predictions
    limit = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))
    state = request.args.get("state")

    battlegrounds = prediction_service.get_top_battlegrounds(state=state, limit=limit)
    return jsonify({
        "count": len(battlegrounds),
        "predictions": battlegrounds
    }), 200

@prediction_bp.route("/predictions/closest-races", methods=["GET"])
@rate_limit()
def get_closest_races():
    limit = int(request.args.get("limit", 15))
    closest = prediction_service.get_closest_races(limit=limit)
    return jsonify({
        "count": len(closest),
        "closest_races": closest
    }), 200

@prediction_bp.route("/predictions/top-battlegrounds", methods=["GET"])
@rate_limit()
def get_top_battlegrounds():
    state = request.args.get("state")
    limit = int(request.args.get("limit", 20))
    bg = prediction_service.get_top_battlegrounds(state=state, limit=limit)
    return jsonify({
        "count": len(bg),
        "battlegrounds": bg
    }), 200

@prediction_bp.route("/predictions/<string:cid>", methods=["GET"])
@rate_limit()
def get_prediction_for_constituency(cid):
    clean_id = sanitize_string(cid)
    swing_arg = request.args.get("swing", "0.0")
    try:
        swing_val = float(swing_arg)
    except ValueError:
        swing_val = 0.0

    pred = prediction_service.predict_constituency(clean_id, swing_pct=swing_val)
    if not pred:
        return jsonify({"error": f"Constituency '{cid}' not found", "status": 404}), 404

    return jsonify(pred), 200

@prediction_bp.route("/predictions/simulate", methods=["POST"])
@rate_limit()
def simulate_swing():
    data = request.get_json(silent=True) or {}
    try:
        swing_pct = float(data.get("swing_pct", 0.0))
    except (ValueError, TypeError):
        swing_pct = 0.0
    
    target = sanitize_string(data.get("target_alliance", "NDA")).upper()
    if target not in ["NDA", "INDIA", "OTHERS"]:
        target = "NDA"

    res = prediction_service.simulate_swing(swing_pct=swing_pct, target_party=target)
    return jsonify(res), 200
