"""
VoteVision AI Server Runner
"""
import os
import sys

# Ensure backend folder is in path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app

env = os.getenv("FLASK_ENV", "development")
app = create_app(env)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    print("=" * 60)
    print(f"🚀 VoteVision AI Server Running on http://127.0.0.1:{port}")
    print(f"🗳️  Platform: Explainable Election Intelligence & Forecasting")
    print(f"📊 Tracking: 543 Lok Sabha Constituencies | 36 States & UTs")
    print("=" * 60)
    app.run(host="0.0.0.0", port=port, debug=False)
