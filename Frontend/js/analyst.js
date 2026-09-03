/**
 * AI Election Analyst Interface Controller
 * Grounded query chat with suggestion chips and verified source citations.
 */

const Analyst = {
  chatHistory: [],

  init() {
    this.attachEvents();
    // Render initial welcome message
    this.appendMessage("ai", `
      Hello! I am your <strong>VoteVision Grounded Election Analyst</strong>.
      <br/><br/>
      I have real-time access to the 543 Lok Sabha constituencies, candidate backgrounds, swing simulation models, and historical margins. Every insight is strictly grounded in verifiable data.
      <br/><br/>
      Click any suggestion below or ask your own question!
    `, ["Constituency Database", "Multi-Model Ensemble", "ECI Historical Records"]);
  },

  attachEvents() {
    const form = document.getElementById("analystChatForm");
    const input = document.getElementById("analystChatInput");

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = input ? input.value.trim() : "";
        if (text) {
          this.ask(text);
          if (input) input.value = "";
        }
      });
    }

    // Suggestion chips
    document.querySelectorAll(".suggestion-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const query = chip.getAttribute("data-query");
        if (query) this.ask(query);
      });
    });
  },

  async ask(question) {
    this.appendMessage("user", question);

    // Typing indicator
    const typingId = this.appendTypingIndicator();

    const data = await API.queryAIAnalyst(question);

    this.removeTypingIndicator(typingId);

    if (!data || !data.answer) {
      this.appendMessage("ai", "I was unable to retrieve analytical data for that inquiry. Please try rephrasing or ask about closest contests, swing scenarios, or constituency breakdowns.", []);
      return;
    }

    // Format markdown bold/table/headers cleanly
    let formattedAnswer = this.formatMarkdown(data.answer);
    this.appendMessage("ai", formattedAnswer, data.grounded_sources || []);
  },

  formatMarkdown(text) {
    let out = text
      .replace(/### (.*?)\n/g, '<h4 style="margin: 0.5rem 0; color:#38bdf8;">$1</h4>')
      .replace(/#### (.*?)\n/g, '<h5 style="margin: 0.4rem 0; color:#f1f5f9;">$1</h5>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/- (.*?)\n/g, '<li>$1</li>');

    // Simple markdown table conversion
    if (out.includes("|")) {
      const lines = out.split("\n");
      let inTable = false;
      let tableHtml = "<table>";
      let processedLines = [];

      for (let line of lines) {
        if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
          if (!inTable) {
            inTable = true;
            tableHtml = "<table>";
          }
          if (line.includes("---")) continue; // Skip separator
          const cells = line.split("|").slice(1, -1).map(c => c.trim());
          tableHtml += `<tr>${cells.map(c => `<td>${c}</td>`).join("")}</tr>`;
        } else {
          if (inTable) {
            tableHtml += "</table>";
            processedLines.push(tableHtml);
            inTable = false;
          }
          processedLines.push(line);
        }
      }
      if (inTable) tableHtml += "</table>", processedLines.push(tableHtml);
      out = processedLines.join("\n");
    }

    return out;
  },

  appendMessage(role, htmlContent, sources = []) {
    const container = document.getElementById("analystChatMessages");
    if (!container) return;

    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${role}`;

    let sourcesHtml = "";
    if (sources && sources.length) {
      sourcesHtml = `
        <div style="margin-top: 0.6rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.4rem;">
          <span style="font-size: 0.68rem; color: var(--text-muted);">GROUNDED SOURCES:</span><br/>
          ${sources.map(s => `<span class="grounded-source-tag">🔒 ${s}</span>`).join(" ")}
        </div>
      `;
    }

    bubble.innerHTML = htmlContent + sourcesHtml;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  },

  appendTypingIndicator() {
    const container = document.getElementById("analystChatMessages");
    if (!container) return null;

    const id = `typing-${Date.now()}`;
    const bubble = document.createElement("div");
    bubble.id = id;
    bubble.className = "chat-bubble ai";
    bubble.innerHTML = `<span style="color:var(--text-muted);">Consulting election model & ECI datasets...</span>`;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
    return id;
  },

  removeTypingIndicator(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
  }
};
