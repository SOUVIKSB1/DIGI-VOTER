"""
Model Evaluation and Diagnostics Routes
"""
from flask import Blueprint, jsonify
from ..services.prediction_service import prediction_service
from ..utils.security import rate_limit

model_bp = Blueprint("model", __name__)

@model_bp.route("/model", methods=["GET"])
@model_bp.route("/model/metrics", methods=["GET"])
@rate_limit()
def get_model_metrics():
    metrics = prediction_service.evaluator.evaluate(prediction_service.predictor.preprocessor.extract_features)
    # Return precomputed metrics
    from ..utils.data_loader import DataLoader
    constituencies = DataLoader.get_constituencies()
    metrics = prediction_service.evaluator.evaluate(constituencies)
    return jsonify(metrics), 200

@model_bp.route("/model/features", methods=["GET"])
@rate_limit()
def get_model_features():
    from ..utils.data_loader import DataLoader
    constituencies = DataLoader.get_constituencies()
    metrics = prediction_service.evaluator.evaluate(constituencies)
    return jsonify({
        "features": metrics["feature_importance"]
    }), 200

@model_bp.route("/model/calibration", methods=["GET"])
@rate_limit()
def get_model_calibration():
    from ..utils.data_loader import DataLoader
    constituencies = DataLoader.get_constituencies()
    metrics = prediction_service.evaluator.evaluate(constituencies)
    return jsonify({
        "calibration_curve": metrics["calibration_curve"]
    }), 200
