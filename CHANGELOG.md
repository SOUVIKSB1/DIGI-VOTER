# Changelog

All notable changes to the VoteVision AI project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-09-03
### Added
- **Complete Platform Overhaul**: Transformed from demo predictor to an explainable election intelligence platform.
- **543 Lok Sabha Constituencies Database**: Full constitutional coverage across all 28 states and 8 union territories.
- **Calibrated Multi-Model Ensemble**: Integrated Random Forest, Gradient Boosting, Logistic Regression, and CalibratedClassifierCV.
- **Explainable AI (XAI)**: SHAP-style feature attribution waterfall for every constituency prediction.
- **Interactive India Election SVG Map**: State-level navigation, constituency locator, and drill-down inspector.
- **Candidate Directory & Compare Tool**: Complete profiles with educational backgrounds, assets, and side-by-side comparative analysis.
- **Multi-Tier Swing Simulator**: Uniform and regional vote swing simulation with 4 preset scenario benchmarks.
- **Grounded AI Election Analyst**: Rule-grounded conversational agent querying verified election datasets without hallucination.
- **Closest Contests & Battlegrounds**: Automated ranking of races with margin < 5.0%.
- **Model Evaluation Diagnostics**: Accuracy, Precision, Recall, F1, ROC-AUC, 5-Fold Cross-Validation, Feature Importance, and Reliability Calibration Curve.
- **Comprehensive API v1**: Complete RESTful endpoints under `/api/v1/` with input sanitization and rate limiting.
- **Automated Testing Suite**: 35 pytest unit and integration tests passing at 100%.
- **CI/CD Workflows**: GitHub Actions for testing matrix, flake8 linting, and build verification.

## [1.0.0] - Prior Release
- Initial baseline constituency prediction prototype.
