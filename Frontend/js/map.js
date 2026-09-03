/**
 * Interactive India Election Map Component
 * Renders SVG states, handles hover tooltips, state drill-down, and constituency drawer triggers.
 */

// Normalized state boundary coordinates for India SVG rendering
const INDIA_STATES_GEO = [
  { id: "JK", name: "Jammu & Kashmir", party: "OTH", path: "M 160 30 L 220 20 L 250 50 L 220 100 L 170 90 L 150 50 Z" },
  { id: "LA", name: "Ladakh", party: "OTH", path: "M 220 20 L 280 40 L 290 80 L 240 100 L 220 100 Z" },
  { id: "HP", name: "Himachal Pradesh", party: "BJP", path: "M 180 95 L 225 100 L 230 135 L 195 140 L 175 110 Z" },
  { id: "PB", name: "Punjab", party: "INC", path: "M 140 105 L 180 95 L 180 145 L 140 155 Z" },
  { id: "UK", name: "Uttarakhand", party: "BJP", path: "M 220 120 L 255 130 L 250 165 L 210 155 Z" },
  { id: "HR", name: "Haryana", party: "BJP", path: "M 165 145 L 195 140 L 190 180 L 155 175 Z" },
  { id: "DL", name: "Delhi", party: "BJP", path: "M 188 162 L 196 162 L 196 170 L 188 170 Z" },
  { id: "RJ", name: "Rajasthan", party: "BJP", path: "M 100 160 L 170 160 L 180 230 L 120 260 L 90 200 Z" },
  { id: "UP", name: "Uttar Pradesh", party: "BJP", path: "M 195 155 L 280 170 L 320 220 L 220 240 L 190 190 Z" },
  { id: "BR", name: "Bihar", party: "BJP", path: "M 310 190 L 380 200 L 375 250 L 310 240 Z" },
  { id: "SK", name: "Sikkim", party: "OTH", path: "M 370 170 L 385 170 L 385 185 L 370 185 Z" },
  { id: "WB", name: "West Bengal", party: "AITC", path: "M 370 200 L 390 200 L 380 300 L 350 280 L 360 230 Z" },
  { id: "AS", name: "Assam", party: "BJP", path: "M 410 180 L 480 185 L 470 220 L 405 215 Z" },
  { id: "AR", name: "Arunachal Pradesh", party: "BJP", path: "M 440 140 L 510 160 L 490 185 L 440 175 Z" },
  { id: "NL", name: "Nagaland", party: "INC", path: "M 475 190 L 500 195 L 495 220 L 475 215 Z" },
  { id: "MN", name: "Manipur", party: "INC", path: "M 470 220 L 495 220 L 490 250 L 470 245 Z" },
  { id: "MZ", name: "Mizoram", party: "OTH", path: "M 455 250 L 475 250 L 470 285 L 455 280 Z" },
  { id: "TR", name: "Tripura", party: "BJP", path: "M 435 240 L 455 240 L 450 265 L 435 260 Z" },
  { id: "ML", name: "Meghalaya", party: "OTH", path: "M 410 215 L 450 215 L 445 235 L 410 235 Z" },
  { id: "JH", name: "Jharkhand", party: "BJP", path: "M 305 240 L 360 245 L 355 295 L 305 290 Z" },
  { id: "OD", name: "Odisha", party: "BJP", path: "M 290 290 L 355 285 L 340 360 L 285 340 Z" },
  { id: "CG", name: "Chhattisgarh", party: "BJP", path: "M 255 240 L 305 250 L 290 350 L 255 330 Z" },
  { id: "MP", name: "Madhya Pradesh", party: "BJP", path: "M 170 215 L 260 225 L 265 290 L 175 280 Z" },
  { id: "GJ", name: "Gujarat", party: "BJP", path: "M 70 230 L 135 225 L 140 300 L 75 290 Z" },
  { id: "MH", name: "Maharashtra", party: "BJP", path: "M 130 290 L 240 290 L 240 370 L 130 360 Z" },
  { id: "GA", name: "Goa", party: "BJP", path: "M 135 390 L 145 390 L 145 405 L 135 405 Z" },
  { id: "TG", name: "Telangana", party: "INC", path: "M 205 340 L 265 345 L 250 405 L 195 390 Z" },
  { id: "AP", name: "Andhra Pradesh", party: "TDP", path: "M 205 395 L 265 370 L 260 460 L 205 450 Z" },
  { id: "KA", name: "Karnataka", party: "BJP", path: "M 140 365 L 205 375 L 190 465 L 140 440 Z" },
  { id: "KL", name: "Kerala", party: "INC", path: "M 155 465 L 180 465 L 170 540 L 150 530 Z" },
  { id: "TN", name: "Tamil Nadu", party: "DMK", path: "M 180 455 L 235 450 L 205 540 L 175 535 Z" }
];

const MapComponent = {
  selectedState: null,
  allConstituencies: [],

  init(constituencies) {
    this.allConstituencies = constituencies || [];
    this.renderSvgMap();
    this.attachEvents();
  },

  renderSvgMap() {
    const container = document.getElementById("mapSvgContainer");
    if (!container) return;

    let svgHtml = `
      <svg viewBox="50 0 480 560" class="india-svg-map" id="indiaMapSvg">
        <defs>
          <filter id="mapGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <g id="statesGroup">
    `;

    INDIA_STATES_GEO.forEach(st => {
      const partyClass = `state-${st.party.toLowerCase()}`;
      svgHtml += `
        <path id="state-${st.id}" 
              data-state-code="${st.id}" 
              data-state-name="${st.name}" 
              data-leading-party="${st.party}" 
              class="state-path ${partyClass}" 
              d="${st.path}" />
      `;
    });

    svgHtml += `
        </g>
      </svg>
      <div id="mapTooltip" class="map-tooltip"></div>
    `;

    container.innerHTML = svgHtml;
  },

  attachEvents() {
    const svg = document.getElementById("indiaMapSvg");
    const tooltip = document.getElementById("mapTooltip");
    if (!svg || !tooltip) return;

    const paths = svg.querySelectorAll(".state-path");
    paths.forEach(p => {
      p.addEventListener("mouseenter", (e) => {
        const stateName = p.getAttribute("data-state-name");
        const party = p.getAttribute("data-leading-party");
        const code = p.getAttribute("data-state-code");
        
        // Find seats for this state
        const stateSeats = this.allConstituencies.filter(c => c.state_code === code || c.state === stateName);
        const totalSeats = stateSeats.length || "1-80";

        tooltip.innerHTML = `
          <strong>${stateName}</strong><br/>
          Total Seats: <strong>${totalSeats}</strong><br/>
          Leading Party: <strong>${party}</strong>
        `;
        tooltip.style.display = "block";
      });

      p.addEventListener("mousemove", (e) => {
        const rect = svg.getBoundingClientRect();
        tooltip.style.left = `${e.clientX - rect.left + 15}px`;
        tooltip.style.top = `${e.clientY - rect.top + 10}px`;
      });

      p.addEventListener("mouseleave", () => {
        tooltip.style.display = "none";
      });

      p.addEventListener("click", () => {
        const stateName = p.getAttribute("data-state-name");
        const stateCode = p.getAttribute("data-state-code");
        this.selectState(stateName, stateCode);
      });
    });
  },

  selectState(stateName, stateCode) {
    this.selectedState = stateName;

    // Highlight path
    document.querySelectorAll(".state-path").forEach(el => el.classList.remove("selected"));
    const activePath = document.getElementById(`state-${stateCode}`);
    if (activePath) activePath.classList.add("selected");

    // Filter constituencies for this state
    const matches = this.allConstituencies.filter(c => c.state === stateName || c.state_code === stateCode);
    this.renderStateInspector(stateName, stateCode, matches);
  },

  renderStateInspector(stateName, stateCode, seats) {
    const container = document.getElementById("mapStateInspector");
    if (!container) return;

    if (!seats.length) {
      container.innerHTML = `
        <div class="card">
          <div class="card-title">State: ${stateName} (${stateCode})</div>
          <p class="card-subtitle">Constituency dataset loading...</p>
        </div>
      `;
      return;
    }

    // Tally party seats
    const tally = {};
    seats.forEach(s => {
      tally[s.leading_party] = (tally[s.leading_party] || 0) + 1;
    });

    let partyChips = Object.entries(tally)
      .map(([p, cnt]) => `<span class="badge badge-${p.toLowerCase()}">${p}: ${cnt}</span>`)
      .join(" ");

    let seatsList = seats.slice(0, 8).map(s => `
      <tr style="cursor:pointer;" onclick="App.openConstituencyDrawer('${s.id}')">
        <td><strong>${s.name}</strong></td>
        <td><span class="badge badge-${s.leading_party.toLowerCase()}">${s.leading_party}</span></td>
        <td><span class="badge ${s.risk_level.includes('Battleground') ? 'badge-battleground' : 'badge-safe'}">${s.win_probability}%</span></td>
        <td>±${s.predicted_margin}%</td>
      </tr>
    `).join("");

    container.innerHTML = `
      <div class="card" style="animation: fadeIn 0.2s ease;">
        <div class="card-header">
          <div>
            <div class="card-title">🗺️ ${stateName} (${stateCode})</div>
            <div class="card-subtitle">${seats.length} Parliamentary Constituencies</div>
          </div>
          <button class="btn btn-primary" onclick="App.switchTab('state_analysis', '${stateName}')">Deep Dive State</button>
        </div>
        <div style="margin-bottom: 1rem; display: flex; gap: 0.4rem; flex-wrap: wrap;">
          ${partyChips}
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Constituency</th>
                <th>Leading</th>
                <th>Win Prob</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              ${seatsList}
            </tbody>
          </table>
        </div>
        <div style="margin-top: 0.75rem; text-align: right;">
          <small class="text-muted">Click any seat to open complete explainable intelligence</small>
        </div>
      </div>
    `;
  }
};
