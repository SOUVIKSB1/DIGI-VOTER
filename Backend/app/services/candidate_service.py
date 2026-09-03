"""
Candidate Service
Manages candidate profiles, filtering, search, and comparative analysis.
"""
from ..utils.data_loader import DataLoader

class CandidateService:
    def get_all(self, party=None, state=None, search=None, limit=50, offset=0):
        candidates = DataLoader.get_candidates()
        results = candidates

        if party:
            results = [c for c in results if c["party"].upper() == party.upper()]
        if state:
            results = [c for c in results if c["state"].lower() == state.lower()]
        if search:
            q = search.lower()
            results = [c for c in results if q in c["name"].lower() or q in c["constituency_name"].lower()]

        total = len(results)
        paginated = results[offset: offset + limit]

        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "candidates": paginated
        }

    def get_by_id(self, cand_id):
        candidates = DataLoader.get_candidates()
        cand = next((c for c in candidates if c["id"].lower() == cand_id.lower()), None)
        if not cand:
            return None

        # Attach constituency intelligence
        constituencies = DataLoader.get_constituencies()
        constituency = next((c for c in constituencies if c["id"].lower() == cand["constituency_id"].lower()), None)

        cand_copy = dict(cand)
        cand_copy["constituency_details"] = constituency
        return cand_copy

    def compare(self, id1, id2):
        c1 = self.get_by_id(id1)
        c2 = self.get_by_id(id2)

        if not c1 or not c2:
            return None

        # Build head-to-head comparison
        prob_diff = round(c1["win_probability"] - c2["win_probability"], 1)
        experience_diff = c1["terms_served"] - c2["terms_served"]

        return {
            "candidate_1": c1,
            "candidate_2": c2,
            "comparison": {
                "win_probability_leader": c1["name"] if prob_diff >= 0 else c2["name"],
                "probability_advantage": abs(prob_diff),
                "experience_leader": c1["name"] if experience_diff >= 0 else c2["name"],
                "assets_comparison": {
                    f"{c1['name']}": f"₹{c1['assets_inr_cr']} Cr",
                    f"{c2['name']}": f"₹{c2['assets_inr_cr']} Cr"
                },
                "criminal_cases": {
                    f"{c1['name']}": 1 if c1["criminal_cases"] else 0,
                    f"{c2['name']}": 1 if c2["criminal_cases"] else 0
                }
            }
        }

candidate_service = CandidateService()
