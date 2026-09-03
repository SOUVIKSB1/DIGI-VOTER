# Contributing to VoteVision AI

Thank you for your interest in contributing to VoteVision AI — an explainable election intelligence and forecasting platform.

## Development Setup

1. Clone the repository:
   ```bash
   git clone git@github.com:SOUVIKSB1/DIGI-VOTER.git
   cd DIGI-VOTER
   ```

2. Install Python dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. Run the automated test suite:
   ```bash
   python -m pytest backend/tests/ -v
   ```

4. Launch the local development server:
   ```bash
   python backend/run.py
   ```
   Open `http://localhost:5001` in your browser.

## Code Standards
- Python code follows PEP8 standards and uses type hints where applicable.
- Flask endpoints should follow RESTful patterns under `/api/v1/`.
- Frontend code utilizes semantic HTML5, CSS tokens, and modular JavaScript without heavy framework bloat.
- All new features must include corresponding unit tests in `backend/tests/`.

## Pull Request Guidelines
1. Fork the repo and create your branch from `main`.
2. Ensure all 35+ pytest tests pass without failure.
3. Write clear, descriptive commit messages.
4. Submit a Pull Request describing your changes and motivation.
