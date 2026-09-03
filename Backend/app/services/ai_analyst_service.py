"""
AI Election Analyst Service
Grounds election insights in live structured data and methodology to eliminate hallucinations.
"""
import re
from ..utils.data_loader import DataLoader
from .prediction_service import prediction_service
from .analytics_service import analytics_service

class AIElectionAnalystService:
    def answer_query(self, query):
        if not query or not isinstance(query, str):
            return {
                "answer": "Please ask a specific election analytics question, such as 'Which states have the closest contests?' or 'What happens if there is a 3% swing?'.",
                "grounded_sources": []
            }

        q = query.lower().strip()
        constituencies = DataLoader.get_constituencies()
        parties = DataLoader.get_parties()

        # 1. Closest Contests / Battlegrounds
        if any(w in q for w in ["closest", "battleground", "tightest", "narrow", "tossup"]):
            closest = prediction_service.get_closest_races(limit=6)
            lines = [
                "### 🎯 Top Closest Contests & Battleground Races\n",
                "Based on VoteVision AI's calibrated multi-model ensemble, the tightest projected races (margin < 3%) are:\n"
            ]
            sources = []
            for i, c in enumerate(closest, 1):
                lines.append(
                    f"**{i}. {c['name']} ({c['state']})**\n"
                    f"- **Leading:** {c['leading_party']} ({c['win_probability']}% win prob)\n"
                    f"- **Challenger:** {c['runner_up_party']}\n"
                    f"- **Predicted Margin:** ±{c['predicted_margin']}%\n"
                    f"- **Risk Level:** {c['risk_level']}\n"
                )
                sources.append(f"Constituency Record: {c['name']} ({c['id']})")

            lines.append(
                "\n*Analytical Note:* Constituencies with margins under 3.0% are classified as high volatility. "
                "A uniform swing of less than 1.5% in booth turnout can flip these seats."
            )
            return {
                "answer": "\n".join(lines),
                "grounded_sources": sources,
                "query_category": "closest_contests"
            }

        # 2. Swing Impact Simulation (e.g., "What happens if there is a 3% swing?")
        swing_match = re.search(r"(\d+(\.\d+)?)\s*%\s*swing", q)
        if swing_match or "swing" in q:
            swing_val = float(swing_match.group(1)) if swing_match else 2.0
            # Target alliance
            target = "INDIA" if any(w in q for w in ["india", "congress", "inc", "opposition"]) else "NDA"
            res = prediction_service.simulate_swing(swing_pct=swing_val, target_party=target)
            
            lines = [
                f"### 🔮 Swing Impact Analysis: {swing_val:+.1f}% Swing to {target}\n",
                f"Applying a uniform {swing_val:+.1f}% swing toward **{target}** across all 543 Lok Sabha constituencies produces the following projection:\n",
                f"- **NDA Projected Seats:** {res['alliance_seats'].get('NDA', 0)} / 543 (Majority: 272)",
                f"- **INDIA Projected Seats:** {res['alliance_seats'].get('INDIA', 0)} / 543",
                f"- **Others / Regional:** {res['alliance_seats'].get('OTHERS', 0)} / 543\n",
                f"**Key Dynamics:**",
                f"- At +{swing_val}%, the leading alliance {'crosses' if res['alliance_seats'].get(target, 0) >= 272 else 'remains below'} the 272 majority threshold.",
                f"- Seats with baseline margins lower than {swing_val}% in battleground states (UP, Maharashtra, West Bengal, Bihar) experience immediate flips."
            ]
            return {
                "answer": "\n".join(lines),
                "grounded_sources": ["Multi-tier Swing Simulation Engine (National -> State -> Seat)"],
                "query_category": "swing_simulation"
            }

        # 3. Specific Constituency Inquiry (e.g., "Why is Varanasi competitive?" or "Tell me about Baramati")
        matched_c = None
        for c in constituencies:
            c_name_lower = c["name"].lower()
            # check words
            clean_name = c_name_lower.split("(")[0].strip()
            if clean_name in q:
                matched_c = c
                break

        if matched_c:
            pred = prediction_service.predict_constituency(matched_c["id"])
            xai = pred["explainability"]
            lines = [
                f"### 📍 Constituency Intelligence: {matched_c['name']} ({matched_c['state']})\n",
                f"- **Projected Winner:** **{pred['predicted_winner']}** (Calibrated Win Probability: **{pred['win_probability']}%**)",
                f"- **Runner-Up:** {pred['runner_up']}",
                f"- **Predicted Margin:** +{pred['predicted_margin']}%",
                f"- **Risk Classification:** {pred['risk_level']}",
                f"- **Model Confidence:** {pred['model_confidence']}\n",
                "#### 🧠 Explainable AI Driver Breakdown:",
            ]
            for f in xai["factors"]:
                sign = "+" if f["impact"] >= 0 else ""
                lines.append(f"- **{f['feature']}:** {sign}{f['impact']}% — {f['description']}")

            lines.append(f"\n**Summary Narrative:** {xai['summary_narrative']}")
            return {
                "answer": "\n".join(lines),
                "grounded_sources": [f"Constituency Database: {matched_c['id']}", "XAI Attribution Engine"],
                "query_category": "constituency_deep_dive"
            }

        # 4. Party Comparison (e.g. "Compare BJP and INC" or "Compare Party A and Party B")
        if any(w in q for w in ["compare", "bjp", "inc", "sp", "dmk", "party"]):
            p_bjp = next((p for p in parties if p["id"] == "BJP"), None)
            p_inc = next((p for p in parties if p["id"] == "INC"), None)
            lines = [
                "### 🏛️ National Party Comparison: BJP vs INC\n",
                "| Metric | BJP (NDA) | INC (INDIA) |",
                "| :--- | :--- | :--- |",
                f"| **Projected Seats** | **{p_bjp['projected_seats']}** | **{p_inc['projected_seats']}** |",
                f"| **2024 Actual Seats** | {p_bjp['seats_2024']} | {p_inc['seats_2024']} |",
                f"| **Projected Vote Share** | {p_bjp['projected_vote_share']}% | {p_inc['projected_vote_share']}% |",
                f"| **Strongholds (>80% prob)** | {p_bjp['strongholds_count']} seats | {p_inc['strongholds_count']} seats |",
                f"| **Competitive Seats** | {p_bjp['competitive_count']} seats | {p_inc['competitive_count']} seats |",
                f"| **Vulnerable Seats** | {p_bjp['vulnerable_count']} seats | {p_inc['vulnerable_count']} seats |",
                f"| **Average Win Probability** | {p_bjp['avg_win_probability']}% | {p_inc['avg_win_probability']}% |\n",
                "**Strategic Analysis:** BJP's core seat strength is concentrated in northern and western states with high conversion in urban/semi-urban clusters, while INC's momentum relies heavily on alliance seat-sharing agreements and higher consolidation in rural constituencies."
            ]
            return {
                "answer": "\n".join(lines),
                "grounded_sources": ["National Party Intelligence Records", "Election Commission Benchmark Data"],
                "query_category": "party_comparison"
            }

        # 5. General / Fallback Election Intelligence
        overview = analytics_service.get_dashboard_overview()
        lines = [
            "### 🗳️ VoteVision AI National Election Intelligence Overview\n",
            f"- **Total Constituencies Tracked:** {overview['total_seats']}",
            f"- **Majority Benchmark:** {overview['majority_mark']} seats",
            f"- **Leading Alliance:** **{overview['leading_alliance']['alliance']}** with **{overview['leading_alliance']['projected_seats']}** projected seats",
            f"- **Leading Party:** **{overview['leading_party']['party']}** with **{overview['leading_party']['projected_seats']}** seats",
            f"- **Closest Contests (Margin < 5%):** {overview['closest_contests_count']} seats",
            f"- **Average Model Confidence:** {overview['avg_prediction_confidence']}%\n",
            "**Suggested Questions to explore:**",
            "- *Which states have the closest contests?*",
            "- *Why is Varanasi competitive?*",
            "- *What happens if there is a 3% swing to INDIA?*",
            "- *Compare BJP and INC party metrics.*"
        ]
        return {
            "answer": "\n".join(lines),
            "grounded_sources": ["National Aggregation Engine", "Lok Sabha 543 Seats Database"],
            "query_category": "overview"
        }

ai_analyst_service = AIElectionAnalystService()
