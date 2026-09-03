/**
 * Swing Simulator Engine (Frontend Controller)
 * Handles interactive slider, scenario presets, national/state swing calculations, and comparison table.
 */

const Simulator = {
  currentSwing: 0.0,
  currentAlliance: "NDA",

  init() {
    this.attachEvents();
    this.updateLiveSimulation();
  },

  attachEvents() {
    const slider = document.getElementById("swingRangeInput");
    const valDisplay = document.getElementById("swingValDisplay");
    const allianceSelect = document.getElementById("swingAllianceSelect");

    if (slider) {
      slider.addEventListener("input", (e) => {
        this.currentSwing = parseFloat(e.target.value);
        if (valDisplay) {
          const sign = this.currentSwing > 0 ? "+" : "";
          valDisplay.textContent = `${sign}${this.currentSwing.toFixed(1)}%`;
        }
        // Deselect presets
        document.querySelectorAll(".scenario-chip").forEach(c => c.classList.remove("active"));
        this.updateLiveSimulation();
      });
    }

    if (allianceSelect) {
      allianceSelect.addEventListener("change", (e) => {
        this.currentAlliance = e.target.value;
        this.updateLiveSimulation();
      });
    }
  },

  applyPreset(presetId, swingVal, alliance = "NDA") {
    this.currentSwing = swingVal;
    this.currentAlliance = alliance;

    const slider = document.getElementById("swingRangeInput");
    const valDisplay = document.getElementById("swingValDisplay");
    const allianceSelect = document.getElementById("swingAllianceSelect");

    if (slider) slider.value = swingVal;
    if (valDisplay) {
      const sign = swingVal > 0 ? "+" : "";
      valDisplay.textContent = `${sign}${swingVal.toFixed(1)}%`;
    }
    if (allianceSelect) allianceSelect.value = alliance;

    document.querySelectorAll(".scenario-chip").forEach(c => {
      c.classList.toggle("active", c.getAttribute("data-preset") === presetId);
    });

    this.updateLiveSimulation();
  },

  async updateLiveSimulation() {
    const result = await API.simulateSwing(this.currentSwing, this.currentAlliance);
    if (!result) return;

    // Update projected seat cards
    const ndaEl = document.getElementById("simNdaSeats");
    const indiaEl = document.getElementById("simIndiaSeats");
    const othEl = document.getElementById("simOthSeats");
    const majStatusEl = document.getElementById("simMajorityStatus");

    const ndaSeats = result.alliance_seats.NDA || 293;
    const indiaSeats = result.alliance_seats.INDIA || 234;
    const othSeats = result.alliance_seats.OTHERS || 16;

    if (ndaEl) ndaEl.textContent = ndaSeats;
    if (indiaEl) indiaEl.textContent = indiaSeats;
    if (othEl) othEl.textContent = othSeats;

    if (majStatusEl) {
      if (ndaSeats >= 272) {
        majStatusEl.innerHTML = `<span class="badge badge-nda">NDA Majority (+${ndaSeats - 272} over mark)</span>`;
      } else if (indiaSeats >= 272) {
        majStatusEl.innerHTML = `<span class="badge badge-india">INDIA Majority (+${indiaSeats - 272} over mark)</span>`;
      } else {
        majStatusEl.innerHTML = `<span class="badge badge-battleground">Hung Parliament (No Coalition >= 272)</span>`;
      }
    }

    // Update progress bar
    const ndaBar = document.getElementById("simNdaBar");
    const indiaBar = document.getElementById("simIndiaBar");
    const othBar = document.getElementById("simOthBar");

    if (ndaBar) ndaBar.style.width = `${(ndaSeats / 543) * 100}%`;
    if (indiaBar) indiaBar.style.width = `${(indiaSeats / 543) * 100}%`;
    if (othBar) othBar.style.width = `${(othSeats / 543) * 100}%`;
  }
};
