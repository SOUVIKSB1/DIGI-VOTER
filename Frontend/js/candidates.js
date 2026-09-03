/**
 * Candidate Directory & Comparative Analysis Tool
 */

const Candidates = {
  allCandidates: [],
  selectedForCompare: [null, null],

  init(candidates) {
    this.allCandidates = candidates || [];
    this.renderDirectory(this.allCandidates.slice(0, 18));
    this.populateCompareSelectors();
    this.attachEvents();
  },

  attachEvents() {
    const searchInput = document.getElementById("candidateSearchInput");
    const partyFilter = document.getElementById("candidatePartyFilter");

    const filterHandler = () => {
      const q = (searchInput ? searchInput.value : "").toLowerCase();
      const p = (partyFilter ? partyFilter.value : "").toUpperCase();

      const filtered = this.allCandidates.filter(c => {
        const matchesName = !q || c.name.toLowerCase().includes(q) || c.constituency_name.toLowerCase().includes(q);
        const matchesParty = !p || c.party.toUpperCase() === p;
        return matchesName && matchesParty;
      });
      this.renderDirectory(filtered.slice(0, 24));
    };

    if (searchInput) searchInput.addEventListener("input", filterHandler);
    if (partyFilter) partyFilter.addEventListener("change", filterHandler);

    const compareSelect1 = document.getElementById("compareCand1Select");
    const compareSelect2 = document.getElementById("compareCand2Select");
    if (compareSelect1 && compareSelect2) {
      compareSelect1.addEventListener("change", () => this.runComparison());
      compareSelect2.addEventListener("change", () => this.runComparison());
    }
  },

  renderDirectory(candidatesList) {
    const container = document.getElementById("candidatesGrid");
    if (!container) return;

    if (!candidatesList.length) {
      container.innerHTML = `<div class="card" style="grid-column: 1/-1; text-align:center; padding: 2rem;">No candidates matched your search criteria.</div>`;
      return;
    }

    container.innerHTML = candidatesList.map(c => `
      <div class="candidate-profile-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div class="candidate-avatar">${c.name.charAt(0)}</div>
          <span class="badge badge-${c.party.toLowerCase()}">${c.party}</span>
        </div>
        <div class="candidate-name">${c.name}</div>
        <div class="candidate-sub">📍 ${c.constituency_name} (${c.state})</div>
        
        <div class="candidate-stat-grid">
          <div class="candidate-stat-item">
            <span>Win Probability</span>
            <strong style="color: ${c.win_probability > 60 ? 'var(--safe-color)' : 'var(--competitive-color)'};">${c.win_probability}%</strong>
          </div>
          <div class="candidate-stat-item">
            <span>Past Vote Share</span>
            <strong>${c.past_vote_share}%</strong>
          </div>
          <div class="candidate-stat-item">
            <span>Experience</span>
            <strong>${c.terms_served} Terms Served</strong>
          </div>
          <div class="candidate-stat-item">
            <span>Declared Assets</span>
            <strong>₹${c.assets_inr_cr} Cr</strong>
          </div>
        </div>

        <div style="margin-top: 0.75rem; font-size: 0.75rem; color: var(--text-secondary);">
          <div><strong>Strengths:</strong> ${c.strengths ? c.strengths[0] : 'Ground presence'}</div>
          <div><strong>Status:</strong> ${c.incumbency_status}</div>
        </div>

        <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
          <button class="btn btn-primary" style="flex: 1; font-size: 0.75rem;" onclick="App.openConstituencyDrawer('${c.constituency_id}')">Inspect Seat</button>
          <button class="btn" style="font-size: 0.75rem;" onclick="Candidates.setCompareTarget('${c.id}')">Compare</button>
        </div>
      </div>
    `).join("");
  },

  populateCompareSelectors() {
    const s1 = document.getElementById("compareCand1Select");
    const s2 = document.getElementById("compareCand2Select");
    if (!s1 || !s2) return;

    const options = this.allCandidates.slice(0, 30).map(c => `
      <option value="${c.id}">${c.name} (${c.party} - ${c.constituency_name})</option>
    `).join("");

    s1.innerHTML = options;
    s2.innerHTML = options;

    if (this.allCandidates.length >= 2) {
      s1.selectedIndex = 0;
      s2.selectedIndex = 1;
      this.runComparison();
    }
  },

  setCompareTarget(candId) {
    App.switchTab("candidates_tab");
    const s2 = document.getElementById("compareCand2Select");
    if (s2) {
      s2.value = candId;
      this.runComparison();
    }
  },

  async runComparison() {
    const s1 = document.getElementById("compareCand1Select");
    const s2 = document.getElementById("compareCand2Select");
    const display = document.getElementById("comparisonResultsDisplay");
    if (!s1 || !s2 || !display) return;

    const id1 = s1.value;
    const id2 = s2.value;

    const data = await API.compareCandidates(id1, id2);
    if (!data) return;

    const c1 = data.candidate_1;
    const c2 = data.candidate_2;
    const comp = data.comparison;

    display.innerHTML = `
      <div class="candidate-compare-wrapper">
        <div class="candidate-profile-card">
          <div style="display:flex; justify-content:space-between;">
            <div class="candidate-avatar">${c1.name.charAt(0)}</div>
            <span class="badge badge-${c1.party.toLowerCase()}">${c1.party}</span>
          </div>
          <div class="candidate-name">${c1.name}</div>
          <div class="candidate-sub">${c1.constituency_name}, ${c1.state}</div>
          <table class="data-table" style="margin-top: 0.5rem;">
            <tr><td>Win Probability</td><td><strong>${c1.win_probability}%</strong></td></tr>
            <tr><td>Past Vote Share</td><td>${c1.past_vote_share}%</td></tr>
            <tr><td>Parliamentary Terms</td><td>${c1.terms_served}</td></tr>
            <tr><td>Assets</td><td>₹${c1.assets_inr_cr} Cr</td></tr>
            <tr><td>Criminal Cases</td><td>${c1.criminal_cases ? '1 Disclosed' : '0'}</td></tr>
          </table>
        </div>

        <div class="compare-vs-badge">VS</div>

        <div class="candidate-profile-card">
          <div style="display:flex; justify-content:space-between;">
            <div class="candidate-avatar">${c2.name.charAt(0)}</div>
            <span class="badge badge-${c2.party.toLowerCase()}">${c2.party}</span>
          </div>
          <div class="candidate-name">${c2.name}</div>
          <div class="candidate-sub">${c2.constituency_name}, ${c2.state}</div>
          <table class="data-table" style="margin-top: 0.5rem;">
            <tr><td>Win Probability</td><td><strong>${c2.win_probability}%</strong></td></tr>
            <tr><td>Past Vote Share</td><td>${c2.past_vote_share}%</td></tr>
            <tr><td>Parliamentary Terms</td><td>${c2.terms_served}</td></tr>
            <tr><td>Assets</td><td>₹${c2.assets_inr_cr} Cr</td></tr>
            <tr><td>Criminal Cases</td><td>${c2.criminal_cases ? '1 Disclosed' : '0'}</td></tr>
          </table>
        </div>
      </div>
      <div style="margin-top: 1rem; background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.2); padding: 0.85rem; border-radius: var(--radius-sm); font-size: 0.85rem;">
        <strong>Comparative Insight:</strong> ${comp.win_probability_leader} holds a <strong>+${comp.probability_advantage}%</strong> win probability advantage.
      </div>
    `;
  }
};
