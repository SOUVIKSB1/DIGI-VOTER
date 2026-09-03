"""
Party Routes
"""
from flask import Blueprint, jsonify, request
from ..utils.data_loader import DataLoader
from ..utils.security import rate_limit, sanitize_string

party_bp = Blueprint("party", __name__)

@party_bp.route("/parties", methods=["GET"])
@rate_limit()
def get_parties():
    alliance = request.args.get("alliance")
    parties = DataLoader.get_parties()
    if alliance:
        al_clean = sanitize_string(alliance).upper()
        parties = [p for p in parties if p["alliance"].upper() == al_clean]
    return jsonify({"parties": parties}), 200

@party_bp.route("/parties/<string:party_code>", methods=["GET"])
@rate_limit()
def get_party(party_code):
    clean_code = sanitize_string(party_code).upper()
    parties = DataLoader.get_parties()
    party = next((p for p in parties if p["id"].upper() == clean_code or p["abbreviation"].upper() == clean_code), None)
    if not party:
        return jsonify({"error": f"Party '{party_code}' not found", "status": 404}), 404

    # Attach list of seats where this party is leading or competitive
    constituencies = DataLoader.get_constituencies()
    leading_seats = [c for c in constituencies if c["leading_party"].upper() == clean_code]
    competitive_seats = [c for c in constituencies if c["runner_up_party"].upper() == clean_code and float(c.get("predicted_margin", 10.0)) < 7.0]

    party_copy = dict(party)
    party_copy["leading_seats_count"] = len(leading_seats)
    party_copy["competitive_seats_count"] = len(competitive_seats)
    party_copy["top_strongholds"] = leading_seats[:10]
    party_copy["key_battlegrounds"] = competitive_seats[:10]

    return jsonify(party_copy), 200
