"""
Health & Status Routes
"""
from flask import Blueprint, jsonify
from ..ml.predictor import ElectionEnsemblePredictor

health_bp = Blueprint("health", __name__)

@health_bp.route("/health", methods=["GET"])
@health_bp.route("/ping", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "VoteVision AI Engine",
        "version": "2.0.0",
        "models": {
            "random_forest": "active",
            "gradient_boosting": "active",
            "logistic_regression": "active",
            "calibrated_ensemble": "active"
        },
        "database": "Lok Sabha 543 Constituencies Loaded"
    }), 200
