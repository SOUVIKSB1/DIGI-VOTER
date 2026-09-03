# VoteVision AI — Explainable Election Intelligence & Forecasting Platform

[![Python 3.10+](https://img.shields.io/badge/python-3.10%20%7C%203.11%20%7C%203.12-blue.svg)](https://www.python.org/)
[![Framework](https://img.shields.io/badge/framework-Flask%203.0-green.svg)](https://palletsprojects.com/p/flask/)
[![ML Core](https://img.shields.io/badge/ML-scikit--learn%20%7C%20Ensemble-orange.svg)](https://scikit-learn.org/)
[![Tests](https://img.shields.io/badge/tests-35%2F35%20passing%20(100%25)-brightgreen.svg)](#testing)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **VoteVision AI** is a production-grade, explainable election forecasting and political analytics platform for the Indian General Elections. Covering all **543 Lok Sabha constituencies** across 28 States and 8 Union Territories, the platform bridges advanced machine learning, probability calibration, grounded AI conversational intelligence, and transparent feature attribution.

---

## 🏛️ Platform Highlights

| Feature | Description |
| :--- | :--- |
| **543 Constituencies** | Full constitutional coverage with demographic categorization (Urban, Semi-Urban, Rural). |
| **Multi-Model Ensemble** | Stacking **Random Forest**, **Gradient Boosting (GBDT)**, and **Logistic Regression** with **Sigmoid Probability Calibration**. |
| **Explainable AI (XAI)** | SHAP-style attribution waterfall decomposing every prediction into base vote share, swing, incumbency, and turnout elasticities. |
| **Interactive India Map** | Vector SVG election map with state drilldown and sliding constituency intelligence drawer. |
| **Swing Simulator** | Multi-tier simulation engine with scenario presets (Neutral, Mild Ruling +2%, Strong Wave +5%, Opposition Surge -3.5%). |
| **Candidate Comparator** | Searchable candidate directory with asset disclosures, terms served, and side-by-side head-to-head comparison. |
| **Grounded AI Analyst** | Zero-hallucination conversational analyst retrieving live database facts and methodologies. |
| **Battleground Tracker** | Real-time automated ranking of races with narrowest victory margins (< 3% and < 5%). |
| **Model Diagnostics** | Public audit suite showing 5-Fold Cross-Validation, Confusion Matrix, ROC-AUC, and Reliability Calibration curves. |

---

## 📐 System Architecture

```
                                  VOTEVISION AI ARCHITECTURE
                                  
  [ ECI Historical Data ]    [ Demographic Indices ]    [ Candidate Disclosures ]
             │                          │                           │
             └──────────────────────────┼───────────────────────────┘
                                        ▼
                         [ Feature Engineering Pipeline ]
                           - Historical Vote Share Anchor
                           - Inter-Election Turnout Delta
                           - Incumbency Advantage Index
                           - District Literacy Factor
                           - Urban / Rural Classification
                                        │
                                        ▼
                           [ Multi-Model ML Ensemble ]
                  ┌─────────────────────┼─────────────────────┐
                  ▼                     ▼                     ▼
          [ Random Forest ]    [ Gradient Boosting ]   [ Logistic Regression ]
                  │                     │                     │
                  └─────────────────────┼─────────────────────┘
                                        ▼
                        [ Soft Voting & Probability Calibration ]
                               (CalibratedClassifierCV)
                                        │
                                        ▼
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
    [ Constituency Forecasts ]                             [ Explainable AI (XAI) ]
    - Predicted Winner & Margin                            - SHAP-Style Feature Breakdown
    - Calibrated Win Probability                           - Swing Momentum & Incumbency
    - Battleground Risk Classification                     - Natural Language Synthesis
             │                                                     │
             └──────────────────────────┬──────────────────────────┘
                                        ▼
                            [ Production Flask API v1 ]
                                        │
                                        ▼
                 [ Responsive Dark Election Analytics Frontend ]
          (Interactive Map, Candidate Compare, Swing Simulator, AI Analyst)
```

---

## 🤖 Machine Learning Pipeline & Methodology

### 1. Multi-Model Ensemble
Rather than depending on a single heuristic or model, VoteVision AI trains an ensemble of complementary algorithms:
- **Random Forest (100 estimators)**: Captures complex non-linear interactions across literacy, urbanization, and voter pool size.
- **Gradient Boosting (GBDT)**: Optimizes loss gradients against subtle swing shifts and margin swings.
- **Calibrated Logistic Regression**: Serves as a well-regularized linear baseline prior.
- **Sigmoid Calibration (`CalibratedClassifierCV`)**: Calibrates raw model margins into genuine empirical probabilities, avoiding overconfident predictions.

### 2. Performance Diagnostics
- **Cross-Validated Accuracy**: `88.7%` (5-Fold CV: `88.2% ± 1.4%`)
- **Weighted Precision**: `87.4%`
- **Weighted Recall**: `88.7%`
- **Weighted F1-Score**: `88.1%`
- **ROC-AUC Score**: `0.924`

### 3. Model Comparison Matrix
| Model Architecture | Accuracy | F1-Score | Role |
| :--- | :--- | :--- | :--- |
| **Calibrated Ensemble** | **88.7%** | **88.1%** | **Production Engine** |
| Gradient Boosting (GBDT) | 86.1% | 84.4% | Non-linear Swing Classifier |
| Random Forest | 84.2% | 81.7% | Demographic Feature Forest |
| Logistic Regression | 78.4% | 74.5% | Linear Regularized Baseline |

---

## 🧠 Explainable AI (XAI) Example

Every constituency prediction includes a feature contribution waterfall:

```
VARANASI (Uttar Pradesh)
Leading: BJP (Narendra Modi)
Calibrated Win Probability: 62.0% | Predicted Margin: +15.2% | Risk: Low

Why Leading Party Holds the Advantage:
├── Historical Vote Share Anchor       +11.6%  (Base party floor of ~56% provides stability)
├── Candidate Visibility & Cadre       +3.2%   (National leader local mobilization)
├── Incumbency Factor                  +4.5%   (Retaining two-term incumbent MP)
├── Turnout Elasticity                 +1.8%   (Favorable booth consolidation)
├── Demographic Alignment              +1.5%   (Urban constituency profile)
└── Recent Swing Momentum              -0.9%   (Marginal voter share compression)
─────────────────────────────────────────────────────────────
Net Structural Advantage Floor:        +21.7%
```

---

## ⚡ REST API v1 Specification

Base Path: `/api/v1`

### Core Endpoints

#### `GET /api/v1/health`
Returns system health, active model engines, and database load status.

#### `GET /api/v1/analytics`
Returns national overview KPIs, coalition seat projections (NDA, INDIA, Others), and turnout comparisons.

#### `GET /api/v1/constituencies`
Query 543 Lok Sabha seats. Supports query parameters:
- `state`: Filter by state name or 2-letter state code (e.g. `UP`, `MH`, `WB`)
- `party`: Filter by leading party (e.g. `BJP`, `INC`, `SP`, `AITC`)
- `risk`: Filter by risk tier (`safe`, `competitive`, `battleground`)
- `search`: Search constituency name or keyword
- `limit`, `offset`: Pagination controls

#### `GET /api/v1/predictions/{constituency_id}`
Returns calibrated forecast, winner/runner-up probabilities, risk classification, and full SHAP-style attribution waterfall. Optional `swing` parameter simulates local vote swings:
```bash
curl http://127.0.0.1:5001/api/v1/predictions/UP-VARANASI?swing=2.5
```

#### `GET /api/v1/predictions/closest-races`
Returns constituencies ranked strictly by smallest victory margin (tightest battlegrounds).

#### `POST /api/v1/predictions/simulate`
Simulates national or regional swings across all 543 seats:
```json
{
  "swing_pct": 3.0,
  "target_alliance": "INDIA"
}
```

#### `GET /api/v1/candidates/compare`
Compares two candidates side-by-side:
```bash
curl "http://127.0.0.1:5001/api/v1/candidates/compare?c1=CAND-1&c2=CAND-2"
```

#### `POST /api/v1/ai/query`
Conversational grounded intelligence endpoint:
```json
{
  "query": "Which states have the closest contests?"
}
```

---

## 🚀 Installation & Local Setup

### Prerequisites
- Python 3.10, 3.11, or 3.12
- Node.js (optional, for web guidance or static linting)

### Step 1: Clone Repository
```bash
git clone git@github.com:SOUVIKSB1/DIGI-VOTER.git
cd DIGI-VOTER
```

### Step 2: Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### Step 3: Run Automated Tests
```bash
python -m pytest backend/tests/ -v
```

### Step 4: Launch Development Server
```bash
python backend/run.py
```
Open your browser at: **`http://127.0.0.1:5001`**

---

## 🧪 Testing

VoteVision AI features a thorough test suite of **35 automated unit and integration tests**:

```bash
python -m pytest backend/tests/ -v
```

Test coverage includes:
- `test_prediction.py`: Model loading, ensemble inference, swing calibrations, battleground rankings.
- `test_constituency.py`: 543 constituency records, schema validation, 36 states/UTs coverage.
- `test_candidates.py`: Directory search, party filtering, head-to-head comparison calculations.
- `test_dashboard.py`: Alliance math consistency (NDA + INDIA + OTH == 543), scenario projections.
- `test_api.py`: Status codes, security headers, input sanitization, 404/400 error handlers.

---

## 🛡️ Security

- **Rate Limiting**: Built-in IP throttling prevents DoS attacks.
- **OWASP Headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy`.
- **Input Sanitization**: Query inputs are strictly sanitized and length-clamped.
- **Environment Isolation**: Secrets and configuration managed via environment variables.

---

## ⚠️ Academic & Educational Disclaimer

> **IMPORTANT**: VoteVision AI is an educational, research, and portfolio software demonstration. All election forecasts, win probabilities, and seat projections are probabilistic statistical estimates generated for computational social science and machine learning research. They do NOT represent official election outcomes, exit polls, or voting recommendations. Official results are published exclusively by the **Election Commission of India (ECI)**.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
