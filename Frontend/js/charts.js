/**
 * Chart Visualizations for VoteVision AI
 * Using Chart.js with responsive dark analytics theme.
 */

const Charts = {
  instances: {},

  destroy(id) {
    if (this.instances[id]) {
      this.instances[id].destroy();
      delete this.instances[id];
    }
  },

  // 1. Alliance Projected Seats Donut Chart
  renderAllianceDonut(canvasId, allianceData) {
    this.destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    this.instances[canvasId] = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["NDA", "INDIA", "Others / Unaligned"],
        datasets: [{
          data: [allianceData.NDA || 293, allianceData.INDIA || 234, allianceData.OTHERS || 16],
          backgroundColor: ["#ff9933", "#19aaed", "#94a3b8"],
          borderColor: "#162032",
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "#94a3b8", font: { family: "Inter", size: 12 } }
          }
        },
        cutout: "68%"
      }
    });
  },

  // 2. Party-wise Projected Seats Bar Chart
  renderPartySeatsBar(canvasId, partyData) {
    this.destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const sorted = Object.entries(partyData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const labels = sorted.map(x => x[0]);
    const values = sorted.map(x => x[1]);

    const colorMap = {
      BJP: "#ff9933",
      INC: "#19aaed",
      SP: "#e31e24",
      AITC: "#20b2aa",
      DMK: "#b22222",
      TDP: "#ffd700",
      SHS: "#ff6600",
      SSUBT: "#ff4500",
      AAP: "#0066a4",
      JDU: "#008000",
      OTH: "#94a3b8"
    };

    this.instances[canvasId] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Projected Seats",
          data: values,
          backgroundColor: labels.map(p => colorMap[p] || "#64748b"),
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: "#94a3b8" }, grid: { display: false } },
          y: { ticks: { color: "#94a3b8" }, grid: { color: "#24324a" } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  },

  // 3. Historical vs Predicted Seats Comparison
  renderHistoricalComparison(canvasId) {
    this.destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    this.instances[canvasId] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["BJP", "INC", "SP", "AITC", "DMK", "TDP"],
        datasets: [
          { label: "2019 Actual", data: [303, 52, 5, 22, 24, 3], backgroundColor: "rgba(148, 163, 184, 0.4)", borderRadius: 3 },
          { label: "2024 Actual", data: [240, 99, 37, 29, 22, 16], backgroundColor: "rgba(56, 189, 248, 0.5)", borderRadius: 3 },
          { label: "VoteVision Model Projection", data: [244, 105, 36, 30, 21, 16], backgroundColor: "#ff9933", borderRadius: 3 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: "#94a3b8" }, grid: { display: false } },
          y: { ticks: { color: "#94a3b8" }, grid: { color: "#24324a" } }
        },
        plugins: {
          legend: { labels: { color: "#94a3b8" } }
        }
      }
    });
  },

  // 4. Feature Importance Horizontal Bar Chart
  renderFeatureImportance(canvasId, features) {
    this.destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const labels = features.map(f => f.feature);
    const values = features.map(f => f.importance);

    this.instances[canvasId] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Importance Weight (%)",
          data: values,
          backgroundColor: "#38bdf8",
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: "#94a3b8" }, grid: { color: "#24324a" } },
          y: { ticks: { color: "#f1f5f9", font: { size: 11 } }, grid: { display: false } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  },

  // 5. Reliability Calibration Curve
  renderCalibrationCurve(canvasId, calibData) {
    this.destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    this.instances[canvasId] = new Chart(ctx, {
      type: "line",
      data: {
        labels: calibData.map(d => d.bin),
        datasets: [
          {
            label: "Calibrated Model Output",
            data: calibData.map(d => d.empirical),
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            fill: true,
            tension: 0.3
          },
          {
            label: "Perfect Calibration (Diagonal)",
            data: calibData.map(d => d.predicted),
            borderColor: "#64748b",
            borderDash: [5, 5],
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: "Predicted Bin (%)", color: "#94a3b8" }, ticks: { color: "#94a3b8" }, grid: { color: "#24324a" } },
          y: { title: { display: true, text: "Observed Frequency (%)", color: "#94a3b8" }, ticks: { color: "#94a3b8" }, grid: { color: "#24324a" } }
        },
        plugins: {
          legend: { labels: { color: "#94a3b8" } }
        }
      }
    });
  }
};
