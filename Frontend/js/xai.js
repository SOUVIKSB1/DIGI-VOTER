/**
 * Explainable AI (XAI) Waterfall & Intelligence Drawer Controller
 */

const XAI = {
  renderWaterfall(factors, totalAdvantage) {
    const maxImpact = Math.max(...factors.map(f => Math.abs(f.impact)), 10);

    let html = `
      <div class="xai-waterfall">
        <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.4rem; color: var(--text-primary);">
          🔍 Feature Attribution Breakdown (SHAP-style):
        </div>
    `;

    factors.forEach(f => {
      const isPos = f.impact >= 0;
      const pctWidth = Math.min(100, Math.round((Math.abs(f.impact) / maxImpact) * 100));
      const sign = isPos ? "+" : "";

      html += `
        <div class="waterfall-row">
          <div class="waterfall-header">
            <span>${f.feature}</span>
            <span class="waterfall-impact ${isPos ? 'positive' : 'negative'}">${sign}${f.impact}%</span>
          </div>
          <div class="waterfall-bar-track">
            <div class="waterfall-bar-fill ${isPos ? 'positive' : 'negative'}" style="width: ${pctWidth}%;"></div>
          </div>
          <div class="waterfall-note">${f.description}</div>
        </div>
      `;
    });

    html += `
      <div style="margin-top: 0.75rem; padding-top: 0.6rem; border-top: 1px dashed var(--border-color); display:flex; justify-content:space-between; font-weight:700;">
        <span>Net Advantage Floor:</span>
        <span class="${totalAdvantage >= 0 ? 'text-safe' : 'text-danger'}" style="font-family: var(--font-mono); color: ${totalAdvantage >= 0 ? 'var(--safe-color)' : 'var(--battleground-color)'};">
          ${totalAdvantage >= 0 ? '+' : ''}${totalAdvantage}%
        </span>
      </div>
    </div>
    `;

    return html;
  },

  populateDrawer(predData) {
    const drawer = document.getElementById("constituencyDrawer");
    const backdrop = document.getElementById("drawerBackdrop");
    const content = document.getElementById("drawerContent");
    if (!drawer || !content) return;

    const raw = predData.raw_constituency || {};
    const xai = predData.explainability || {};
    const factors = xai.factors || [];
    const advantage = xai.overall_advantage || 0.0;

    let probBreakdownHtml = (predData.probability_breakdown || []).slice(0, 4).map(p => `
      <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin: 0.2rem 0;">
        <span><strong class="badge badge-${p.party.toLowerCase()}">${p.party}</strong></span>
        <span style="font-family: var(--font-mono);">${p.probability}%</span>
      </div>
    `).join("");

    content.innerHTML = `
      <div style="margin-bottom: 1.25rem;">
        <span class="badge ${predData.risk_level.includes('Battleground') ? 'badge-battleground' : 'badge-safe'}">${predData.risk_level}</span>
        <h2 style="font-size: 1.45rem; font-weight: 800; margin-top: 0.4rem; color: #fff;">${predData.constituency_name}</h2>
        <div style="font-size: 0.82rem; color: var(--text-secondary);">State: ${predData.state} | Total Electors: ~${(raw.electors || 1600000).toLocaleString()}</div>
      </div>

      <div class="card" style="margin-bottom: 1rem; background: #0f172a;">
        <div class="card-header">
          <div class="card-title">Forecast Verdict</div>
          <span class="badge badge-nda">Confidence: ${predData.model_confidence}</span>
        </div>
        <div style="display:flex; align-items: baseline; gap: 0.75rem; margin-bottom: 0.5rem;">
          <span style="font-size: 1.5rem; font-weight: 800; color: #fff;">${predData.predicted_winner}</span>
          <span style="font-size: 1.85rem; font-weight: 800; font-family: var(--font-mono); color: var(--safe-color);">${predData.win_probability}%</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
          Predicted victory margin: <strong>+${predData.predicted_margin}%</strong> over runner-up <strong>${predData.runner_up}</strong>.
        </div>
        <div style="background: rgba(255,255,255,0.02); padding: 0.6rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom: 0.3rem;">PROBABILITY SPREAD:</div>
          ${probBreakdownHtml}
        </div>
      </div>

      <div class="card" style="margin-bottom: 1rem;">
        ${this.renderWaterfall(factors, advantage)}
        <div style="margin-top: 0.75rem; font-size: 0.78rem; line-height: 1.45; color: var(--text-secondary); background: rgba(56, 189, 248, 0.05); padding: 0.65rem; border-radius: var(--radius-sm); border: 1px solid rgba(56, 189, 248, 0.15);">
          ${xai.summary_narrative || 'Model prediction grounded in historical constituency behavior, local swing momentum, and voter turnout patterns.'}
        </div>
      </div>

      <div class="card">
        <div class="card-title" style="margin-bottom: 0.75rem;">Constituency Indicators</div>
        <table class="data-table">
          <tr><td>Demographic Type</td><td><strong>${raw.demographic_type || 'Semi-Urban'}</strong></td></tr>
          <tr><td>Literacy Rate</td><td>${raw.literacy_rate || 72}%</td></tr>
          <tr><td>2019 Winner</td><td>${raw.winner_2019} (+${raw.margin_pct_2019}%)</td></tr>
          <tr><td>2024 Winner</td><td>${raw.winner_2024} (+${raw.margin_pct_2024}%)</td></tr>
          <tr><td>Voter Turnout (2024)</td><td>${raw.turnout_2024}% (Trend: ${raw.past_swing > 0 ? '+' : ''}${raw.past_swing}%)</td></tr>
          <tr><td>Key Voter Issues</td><td>${(raw.key_issues || []).join(', ')}</td></tr>
        </table>
      </div>
    `;

    drawer.classList.add("open");
    if (backdrop) backdrop.classList.add("open");
  },

  closeDrawer() {
    const drawer = document.getElementById("constituencyDrawer");
    const backdrop = document.getElementById("drawerBackdrop");
    if (drawer) drawer.classList.remove("open");
    if (backdrop) backdrop.classList.remove("open");
  }
};
