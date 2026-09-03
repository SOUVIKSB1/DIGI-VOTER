/**
 * VoteVision AI - Main Application Controller
 */

const App = {
  state: {
    overview: null,
    constituencies: [],
    candidates: [],
    parties: [],
    modelMetrics: null,
    selectedState: null,
    currentTab: "home_tab"
  },

  async init() {
    console.log("Initializing VoteVision AI Platform...");
    this.setupNavigation();
    this.setupDrawer();

    // Fetch initial datasets
    const [overview, constData, candData, partyData, metrics] = await Promise.all([
      API.getOverview(),
      API.getConstituencies({ limit: 543 }),
      API.getCandidates({ limit: 60 }),
      API.getParties(),
      API.getModelMetrics()
    ]);

    this.state.overview = overview || {};
    this.state.constituencies = (constData && constData.constituencies) || [];
    this.state.candidates = (candData && candData.candidates) || [];
    this.state.parties = (partyData && partyData.parties) || [];
    this.state.modelMetrics = metrics || {};

    // Render components
    this.renderHomeOverview();
    this.renderDashboard();
    this.renderConstituencyTable();
    this.renderBattlegrounds();
    this.renderParties();
    this.renderModelEvaluation();
    this.setupCascadingFilters();

    // Initialize sub-modules
    MapComponent.init(this.state.constituencies);
    Simulator.init();
    Candidates.init(this.state.candidates);
    Analyst.init();
  },

  setupNavigation() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const tabId = btn.getAttribute("data-tab");
        this.switchTab(tabId);
      });
    });
  },

  switchTab(tabId, extraData = null) {
    this.state.currentTab = tabId;

    // Update tab bar buttons
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
    });

    // Update view panels
    document.querySelectorAll(".tab-content").forEach(p => {
      p.classList.toggle("active", p.id === tabId);
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Handle extra deep link data (e.g. State Analysis tab with stateName)
    if (tabId === "state_analysis" && extraData) {
      this.renderStateDeepDive(extraData);
    }
  },

  setupDrawer() {
    const backdrop = document.getElementById("drawerBackdrop");
    const closeBtn = document.getElementById("drawerCloseBtn");

    if (backdrop) backdrop.addEventListener("click", () => XAI.closeDrawer());
    if (closeBtn) closeBtn.addEventListener("click", () => XAI.closeDrawer());
  },

  async openConstituencyDrawer(cid) {
    const pred = await API.getPrediction(cid);
    if (pred) {
      XAI.populateDrawer(pred);
    }
  },

  renderHomeOverview() {
    const ov = this.state.overview;
    if (!ov) return;

    // KPI Values
    document.getElementById("kpiTotalSeats").textContent = ov.total_seats || 543;
    document.getElementById("kpiLeadingAlliance").textContent = `${ov.leading_alliance?.alliance || 'NDA'} (${ov.leading_alliance?.projected_seats || 293})`;
    document.getElementById("kpiLeadingParty").textContent = `${ov.leading_party?.party || 'BJP'} (${ov.leading_party?.projected_seats || 244})`;
    document.getElementById("kpiAvgConfidence").textContent = `${ov.avg_prediction_confidence || 88.4}%`;
    document.getElementById("kpiBattlegroundsCount").textContent = ov.closest_contests_count || 38;

    // Majority Progress Bar
    const ndaSeats = ov.alliance_breakdown?.NDA || 293;
    const indiaSeats = ov.alliance_breakdown?.INDIA || 234;
    const othSeats = ov.alliance_breakdown?.OTHERS || 16;

    const barNda = document.getElementById("barSegmentNda");
    const barIndia = document.getElementById("barSegmentIndia");
    const barOth = document.getElementById("barSegmentOth");

    if (barNda) {
      barNda.style.width = `${(ndaSeats / 543) * 100}%`;
      barNda.textContent = `NDA ${ndaSeats}`;
    }
    if (barIndia) {
      barIndia.style.width = `${(indiaSeats / 543) * 100}%`;
      barIndia.textContent = `INDIA ${indiaSeats}`;
    }
    if (barOth) {
      barOth.style.width = `${(othSeats / 543) * 100}%`;
      barOth.textContent = `${othSeats}`;
    }

    // Top battlegrounds ticker on home
    const tickerContainer = document.getElementById("homeBattlegroundTicker");
    if (tickerContainer) {
      const topTight = this.state.constituencies
        .filter(c => parseFloat(c.predicted_margin) < 3.0)
        .slice(0, 4);

      tickerContainer.innerHTML = topTight.map(c => `
        <div class="card" style="padding: 0.85rem; cursor:pointer;" onclick="App.openConstituencyDrawer('${c.id}')">
          <div style="display:flex; justify-content:space-between; font-size: 0.78rem;">
            <span>📍 ${c.name}</span>
            <span class="badge badge-battleground">±${c.predicted_margin}%</span>
          </div>
          <div style="font-weight:700; margin-top:0.3rem;">${c.leading_party} vs ${c.runner_up_party}</div>
          <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.2rem;">Win Prob: ${c.win_probability}%</div>
        </div>
      `).join("");
    }
  },

  renderDashboard() {
    const ov = this.state.overview;
    if (!ov) return;

    Charts.renderAllianceDonut("allianceDonutChart", ov.alliance_breakdown || {});
    Charts.renderPartySeatsBar("partySeatsBarChart", ov.party_breakdown || {});
    Charts.renderHistoricalComparison("historicalBarChart");
  },

  renderConstituencyTable() {
    const container = document.getElementById("constituencyTableBody");
    const countEl = document.getElementById("constituencyDisplayCount");
    if (!container) return;

    const list = this.state.constituencies.slice(0, 30);
    if (countEl) countEl.textContent = `Showing 30 of ${this.state.constituencies.length} seats`;

    container.innerHTML = list.map(c => `
      <tr style="cursor:pointer;" onclick="App.openConstituencyDrawer('${c.id}')">
        <td><strong>${c.name}</strong></td>
        <td>${c.state}</td>
        <td><span class="badge badge-${c.leading_party.toLowerCase()}">${c.leading_party}</span></td>
        <td><span class="badge badge-${c.runner_up_party.toLowerCase()}">${c.runner_up_party}</span></td>
        <td><strong style="color: ${c.win_probability > 65 ? 'var(--safe-color)' : 'var(--competitive-color)'};">${c.win_probability}%</strong></td>
        <td>±${c.predicted_margin}%</td>
        <td><span class="badge ${c.risk_level.includes('Battleground') ? 'badge-battleground' : 'badge-safe'}">${c.risk_level}</span></td>
        <td><button class="btn btn-primary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">Explain XAI</button></td>
      </tr>
    `).join("");

    // Setup search filter for constituency tab
    const searchInput = document.getElementById("constituencySearchInput");
    const stateFilter = document.getElementById("constituencyStateFilter");
    const partyFilter = document.getElementById("constituencyPartyFilter");

    const doFilter = () => {
      const q = (searchInput ? searchInput.value : "").toLowerCase();
      const st = (stateFilter ? stateFilter.value : "");
      const p = (partyFilter ? partyFilter.value : "").toUpperCase();

      const filtered = this.state.constituencies.filter(c => {
        const mQ = !q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
        const mS = !st || c.state === st;
        const mP = !p || c.leading_party.toUpperCase() === p;
        return mQ && mS && mP;
      });

      if (countEl) countEl.textContent = `Showing ${Math.min(50, filtered.length)} of ${filtered.length} seats`;
      container.innerHTML = filtered.slice(0, 50).map(c => `
        <tr style="cursor:pointer;" onclick="App.openConstituencyDrawer('${c.id}')">
          <td><strong>${c.name}</strong></td>
          <td>${c.state}</td>
          <td><span class="badge badge-${c.leading_party.toLowerCase()}">${c.leading_party}</span></td>
          <td><span class="badge badge-${c.runner_up_party.toLowerCase()}">${c.runner_up_party}</span></td>
          <td><strong style="color: ${c.win_probability > 65 ? 'var(--safe-color)' : 'var(--competitive-color)'};">${c.win_probability}%</strong></td>
          <td>±${c.predicted_margin}%</td>
          <td><span class="badge ${c.risk_level.includes('Battleground') ? 'badge-battleground' : 'badge-safe'}">${c.risk_level}</span></td>
          <td><button class="btn btn-primary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">Explain XAI</button></td>
        </tr>
      `).join("");
    };

    if (searchInput) searchInput.addEventListener("input", doFilter);
    if (stateFilter) stateFilter.addEventListener("change", doFilter);
    if (partyFilter) partyFilter.addEventListener("change", doFilter);
  },

  renderBattlegrounds() {
    const container = document.getElementById("battlegroundsTableBody");
    if (!container) return;

    // Filter tightest races
    const bgList = this.state.constituencies
      .filter(c => parseFloat(c.predicted_margin) < 5.0)
      .sort((a, b) => parseFloat(a.predicted_margin) - parseFloat(b.predicted_margin));

    container.innerHTML = bgList.map((c, i) => `
      <tr style="cursor:pointer;" onclick="App.openConstituencyDrawer('${c.id}')">
        <td><strong>#${i + 1}</strong></td>
        <td><strong>${c.name}</strong><br/><small class="text-muted">${c.state}</small></td>
        <td><span class="badge badge-${c.leading_party.toLowerCase()}">${c.leading_party}</span></td>
        <td><span class="badge badge-${c.runner_up_party.toLowerCase()}">${c.runner_up_party}</span></td>
        <td><span class="badge badge-battleground">±${c.predicted_margin}%</span></td>
        <td><strong>${c.win_probability}%</strong></td>
        <td>${c.demographic_type}</td>
        <td><button class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size:0.75rem;">Inspect</button></td>
      </tr>
    `).join("");
  },

  renderParties() {
    const container = document.getElementById("partiesGrid");
    if (!container) return;

    container.innerHTML = this.state.parties.map(p => `
      <div class="card" style="border-top: 3px solid ${p.color || '#64748b'};">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.5rem;">
          <div>
            <div style="font-size: 1.25rem; font-weight: 800; color: #fff;">${p.abbreviation}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${p.name}</div>
          </div>
          <span class="badge badge-${p.alliance.toLowerCase()}">${p.alliance}</span>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 0.75rem 0; font-size: 0.8rem;">
          <div class="candidate-stat-item">
            <span>Projected Seats</span>
            <strong style="font-size: 1.15rem; color: #fff;">${p.projected_seats}</strong>
          </div>
          <div class="candidate-stat-item">
            <span>Vote Share</span>
            <strong>${p.projected_vote_share}%</strong>
          </div>
          <div class="candidate-stat-item">
            <span>Strongholds</span>
            <strong style="color: var(--safe-color);">${p.strongholds_count}</strong>
          </div>
          <div class="candidate-stat-item">
            <span>Competitive</span>
            <strong style="color: var(--competitive-color);">${p.competitive_count}</strong>
          </div>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.5rem;">
          Leader: <strong>${p.leader}</strong> | Symbol: <strong>${p.symbol}</strong>
        </div>
      </div>
    `).join("");
  },

  renderModelEvaluation() {
    const m = this.state.modelMetrics;
    if (!m || !m.summary) return;

    // Fill metrics cards
    const summary = m.summary;
    document.getElementById("evalAccuracy").textContent = `${summary.ensemble_accuracy}%`;
    document.getElementById("evalPrecision").textContent = `${summary.precision}%`;
    document.getElementById("evalRecall").textContent = `${summary.recall}%`;
    document.getElementById("evalF1").textContent = `${summary.f1_score}%`;
    document.getElementById("evalRocAuc").textContent = `${summary.roc_auc}`;
    document.getElementById("evalCv").textContent = `${summary.cv_score_mean}% (±${summary.cv_score_std}%)`;

    // Model comparison table
    const compTable = document.getElementById("modelComparisonTableBody");
    if (compTable && m.model_comparison) {
      compTable.innerHTML = m.model_comparison.map(row => `
        <tr>
          <td><strong>${row.model}</strong></td>
          <td><strong>${row.accuracy}%</strong></td>
          <td>${row.f1}%</td>
          <td><span class="badge ${row.status === 'Production' ? 'badge-safe' : 'badge-others'}">${row.status}</span></td>
        </tr>
      `).join("");
    }

    // Feature importance and calibration curve
    Charts.renderFeatureImportance("featureImportanceChart", m.feature_importance || []);
    Charts.renderCalibrationCurve("calibrationCurveChart", m.calibration_curve || []);

    // Confusion Matrix Grid
    const cmContainer = document.getElementById("confusionMatrixContainer");
    if (cmContainer && m.confusion_matrix) {
      const labels = m.confusion_matrix.labels;
      const matrix = m.confusion_matrix.matrix;
      const cols = labels.length + 1;

      let cmHtml = `<div class="confusion-matrix-grid" style="grid-template-columns: repeat(${cols}, 1fr);">`;
      cmHtml += `<div class="cm-cell header">True\\Pred</div>`;
      labels.forEach(l => cmHtml += `<div class="cm-cell header">${l}</div>`);

      for (let r = 0; r < matrix.length; r++) {
        cmHtml += `<div class="cm-cell header">${labels[r]}</div>`;
        for (let c = 0; c < matrix[r].length; c++) {
          const val = matrix[r][c];
          const isDiag = (r === c);
          const bg = isDiag ? 'rgba(16, 185, 129, 0.25)' : (val > 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255, 255, 255, 0.02)');
          cmHtml += `<div class="cm-cell" style="background:${bg}; color:${isDiag ? '#34d399' : '#f1f5f9'};">${val}</div>`;
        }
      }
      cmHtml += `</div>`;
      cmContainer.innerHTML = cmHtml;
    }
  },

  setupCascadingFilters() {
    const states = [...new Set(this.state.constituencies.map(c => c.state))].sort();
    const stSelect = document.getElementById("cascadeStateSelect");
    const cSelect = document.getElementById("cascadeConstituencySelect");
    const filterStateFilter = document.getElementById("constituencyStateFilter");

    if (stSelect) {
      states.forEach(st => {
        const opt = document.createElement("option");
        opt.value = st;
        opt.textContent = st;
        stSelect.appendChild(opt);
      });

      stSelect.addEventListener("change", (e) => {
        const val = e.target.value;
        if (cSelect) {
          cSelect.innerHTML = `<option value="">All Constituencies</option>`;
          const filtered = this.state.constituencies.filter(c => !val || c.state === val);
          filtered.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.id;
            opt.textContent = c.name;
            cSelect.appendChild(opt);
          });
        }
      });
    }

    if (filterStateFilter) {
      states.forEach(st => {
        const opt = document.createElement("option");
        opt.value = st;
        opt.textContent = st;
        filterStateFilter.appendChild(opt);
      });
    }

    if (cSelect) {
      cSelect.addEventListener("change", (e) => {
        if (e.target.value) {
          this.openConstituencyDrawer(e.target.value);
        }
      });
    }
  },

  renderStateDeepDive(stateName) {
    const container = document.getElementById("stateDeepDiveContent");
    if (!container) return;

    const seats = this.state.constituencies.filter(c => c.state.toLowerCase() === stateName.toLowerCase());
    if (!seats.length) {
      container.innerHTML = `<div class="card">State '${stateName}' details not found.</div>`;
      return;
    }

    const tally = {};
    seats.forEach(s => tally[s.leading_party] = (tally[s.leading_party] || 0) + 1);

    container.innerHTML = `
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header">
          <div>
            <h2 style="font-size: 1.5rem; font-weight:800; color:#fff;">📍 State Analysis: ${stateName}</h2>
            <div class="card-subtitle">Total Parliamentary Constituencies: ${seats.length}</div>
          </div>
          <span class="badge badge-nda">State Code: ${seats[0].state_code}</span>
        </div>
        <div style="display:flex; gap: 0.5rem; flex-wrap:wrap; margin-bottom: 1rem;">
          ${Object.entries(tally).map(([p, cnt]) => `<span class="badge badge-${p.toLowerCase()}">${p}: ${cnt} Seats</span>`).join(" ")}
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Constituency</th>
                <th>Leading Party</th>
                <th>Runner-up</th>
                <th>Win Prob</th>
                <th>Predicted Margin</th>
                <th>Turnout (2024)</th>
                <th>Demographics</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${seats.map(s => `
                <tr style="cursor:pointer;" onclick="App.openConstituencyDrawer('${s.id}')">
                  <td><strong>${s.name}</strong></td>
                  <td><span class="badge badge-${s.leading_party.toLowerCase()}">${s.leading_party}</span></td>
                  <td><span class="badge badge-${s.runner_up_party.toLowerCase()}">${s.runner_up_party}</span></td>
                  <td><strong>${s.win_probability}%</strong></td>
                  <td>±${s.predicted_margin}%</td>
                  <td>${s.turnout_2024}%</td>
                  <td>${s.demographic_type}</td>
                  <td><button class="btn btn-primary" style="padding: 0.2rem 0.5rem; font-size: 0.72rem;">Inspect</button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
};

window.addEventListener("DOMContentLoaded", () => App.init());
