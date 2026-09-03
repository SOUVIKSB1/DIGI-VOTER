"""
VoteVision AI Backend Application Factory
"""
import os
from pathlib import Path
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from .config import config_by_name
from .utils.security import add_security_headers

# Blueprints
from .routes.health import health_bp
from .routes.dashboard import dashboard_bp
from .routes.constituency import constituency_bp
from .routes.prediction import prediction_bp
from .routes.candidate import candidate_bp
from .routes.party import party_bp
from .routes.model import model_bp
from .routes.ai_analyst import ai_analyst_bp

def find_frontend_dir():
    """
    Robustly locate the Frontend static directory across macOS, Linux (Render/Ubuntu),
    Docker containers, and development environments regardless of casing or working directory.
    """
    current_file = Path(__file__).resolve()
    # Typical locations:
    # 1. Repo root (parent of Backend/app/ -> parent of Backend -> root)
    repo_root = current_file.parent.parent.parent
    cwd = Path(os.getcwd())

    candidate_paths = [
        repo_root / "Frontend",
        repo_root / "frontend",
        current_file.parent.parent / "Frontend",
        current_file.parent.parent / "frontend",
        cwd / "Frontend",
        cwd / "frontend",
        cwd.parent / "Frontend",
        cwd.parent / "frontend",
        Path("/app/Frontend"),
        Path("/app/frontend")
    ]

    for p in candidate_paths:
        if (p / "index.html").exists():
            return str(p.resolve())

    # Fallback to repo_root / "Frontend"
    return str((repo_root / "Frontend").resolve())

def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    frontend_dir = find_frontend_dir()

    app = Flask(
        __name__,
        static_folder=frontend_dir,
        static_url_path="/"
    )
    app.config.from_object(config_by_name.get(config_name, config_by_name["development"]))

    # Setup CORS
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    # Security Headers Hook
    @app.after_request
    def apply_security_headers(response):
        return add_security_headers(response)

    # Register Blueprints under /api/v1
    api_prefix = "/api/v1"
    app.register_blueprint(health_bp, url_prefix=api_prefix)
    app.register_blueprint(dashboard_bp, url_prefix=api_prefix)
    app.register_blueprint(constituency_bp, url_prefix=api_prefix)
    app.register_blueprint(prediction_bp, url_prefix=api_prefix)
    app.register_blueprint(candidate_bp, url_prefix=api_prefix)
    app.register_blueprint(party_bp, url_prefix=api_prefix)
    app.register_blueprint(model_bp, url_prefix=api_prefix)
    app.register_blueprint(ai_analyst_bp, url_prefix=api_prefix)

    # Legacy fallback routes for backward compatibility with v0 endpoints
    @app.route("/api/predict", methods=["GET", "POST"])
    def legacy_predict():
        from flask import redirect, request
        cid = request.args.get("constituency_id", "UP-VARANASI")
        return redirect(f"/api/v1/predictions/{cid}")

    @app.route("/api/candidates", methods=["GET"])
    def legacy_candidates():
        from flask import redirect
        return redirect("/api/v1/candidates")

    @app.route("/api/stats", methods=["GET"])
    def legacy_stats():
        from flask import redirect
        return redirect("/api/v1/analytics")

    # Favicon Route
    @app.route("/favicon.ico")
    def favicon():
        fav = Path(frontend_dir) / "favicon.ico"
        if fav.is_file():
            return send_from_directory(frontend_dir, "favicon.ico")
        return ("", 204)

    # Serve Frontend Single Page App & static assets
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        target = Path(frontend_dir) / path
        if path != "" and target.is_file():
            return send_from_directory(frontend_dir, path)
        return send_from_directory(frontend_dir, "index.html")

    # Standard Error Handlers
    @app.errorhandler(404)
    def not_found_error(e):
        return jsonify({"error": "Resource not found", "status": 404}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error occurred", "status": 500}), 500

    @app.errorhandler(400)
    def bad_request_error(e):
        return jsonify({"error": "Bad request format", "status": 400}), 400

    return app
