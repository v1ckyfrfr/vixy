// chat.js — Logic for chat.html

const token = localStorage.getItem("token");
if (!token) window.location.href = "/";

let isGenerating = false;
let chatHistory = []; // {role, text}[]
let sessionSaved = false; // only save to Recent Chats on first message of session
let currentSessionId = null; // ID of the currently active session

// ─── Profile ─────────────────────────────────────────────────────────────────

async function loadProfile() {
  try {
    const res = await fetch("/api/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401 || res.status === 403) {
      logout();
      return;
    }
    if (!res.ok) return;
    const { user } = await res.json();
    if (user) {
      const name = user.username || "User";
      const initial = name.charAt(0).toUpperCase();
      document.getElementById("sidebarAvatar").textContent = initial;
      document.getElementById("sidebarName").textContent = name;
      document.getElementById("sidebarEmail").textContent = user.email || "—";
    }
  } catch (e) {}
}

// ─── Recent chats sidebar ────────────────────────────────────────────────────

function renderHistory() {
  const container = document.getElementById("chatHistoryList");
  const sessions = JSON.parse(localStorage.getItem("vx_sessions") || "[]");
  if (sessions.length === 0) {
    container.innerHTML =
      '<div style="padding:6px 10px;font-size:0.78rem;color:var(--text-muted)">No past chats yet</div>';
    return;
  }
  container.innerHTML = sessions
    .slice(0, 8)
    .map(
      (s, i) =>
        `<div class="chat-history-item" onclick="loadSession(${i})">
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="flex-shrink:0">
          <path stroke-width="2" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        <span class="chat-history-title">${escapeHtml(s.title)}</span>
      </div>`,
    )
    .join("");
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function removeEmptyState() {
  document.getElementById("emptyState")?.remove();
}

function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 160) + "px";
}

function handleKey(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!isGenerating && document.getElementById("msgInput").value.trim())
      send();
  }
}

function setGenerating(val) {
  isGenerating = val;
  const sendBtn = document.getElementById("sendBtn");
  const stopBtn = document.getElementById("stopBtn");
  const input = document.getElementById("msgInput");
  sendBtn.disabled = val;
  stopBtn.classList.toggle("visible", val);
  input.disabled = val;
  if (!val) {
    sendBtn.disabled = !input.value.trim();
    input.disabled = false;
  }
}

function stopGeneration() {
  setGenerating(false);
  hideTyping();
  appendMessage("ai", "[Generation stopped]");
}

// ─── Message rendering ────────────────────────────────────────────────────────

function appendMessage(role, text) {
  removeEmptyState();
  const box = document.getElementById("chatBox");
  const isUser = role === "user";

  if (isUser) {
    const div = document.createElement("div");
    div.className = "msg-group";
    div.innerHTML = `
      <div class="msg-user">
        <div class="msg-user-bubble">${escapeHtml(text).replace(/\n/g, "<br>")}</div>
      </div>`;
    box.appendChild(div);
  } else {
    const formatted = formatResponse(text);
    const div = document.createElement("div");
    div.className = "msg-group";
    div.innerHTML = `
      <div class="msg-ai">
        <div class="ai-avatar">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-width="2" d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 0v20M2 12h20"/>
          </svg>
        </div>
        <div class="ai-content">
          <div class="ai-name">Vixy</div>
          <div class="ai-bubble">${formatted}</div>
          <div class="msg-actions">
            <button class="msg-action-btn" onclick="copyText(this)" data-text="${escapeHtml(text)}">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke-width="2"/>
                <path stroke-width="2" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              Copy
            </button>
          </div>
        </div>
      </div>`;
    box.appendChild(div);
    
    if (window.hljs) {
      div.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
    }
  }
  box.scrollTop = box.scrollHeight;
}

function formatResponse(text) {
  let escaped = escapeHtml(text);
  
  const codeBlocks = [];
  // Match code blocks with or without language specifier
  escaped = escaped.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    codeBlocks.push({ lang, code });
    return `___CODE_BLOCK_${codeBlocks.length - 1}___`;
  });
  // Fallback for code blocks without newline after ```
  escaped = escaped.replace(/```([\s\S]*?)```/g, (match, code) => {
    codeBlocks.push({ lang: '', code });
    return `___CODE_BLOCK_${codeBlocks.length - 1}___`;
  });

  escaped = escaped
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
    
  // Restore code blocks without applying <br> to their newlines
  escaped = escaped.replace(/___CODE_BLOCK_(\d+)___/g, (match, index) => {
    const block = codeBlocks[index];
    const langClass = block.lang ? ` class="language-${block.lang}"` : '';
    return `<pre><code${langClass}>${block.code}</code></pre>`;
  });
  
  return escaped;
}

function copyText(btn) {
  const text = btn.getAttribute("data-text");
  navigator.clipboard.writeText(text).then(() => {
    btn.innerHTML = `
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <polyline stroke-width="2" points="20 6 9 17 4 12"/>
      </svg>
      Copied!`;
    setTimeout(() => {
      btn.innerHTML = `
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="9" y="9" width="13" height="13" rx="2" stroke-width="2"/>
          <path stroke-width="2" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
        </svg>
        Copy`;
    }, 2000);
  });
}

function showTyping() {
  removeEmptyState();
  const box = document.getElementById("chatBox");
  const row = document.createElement("div");
  row.id = "typingRow";
  row.className = "typing-indicator";
  row.innerHTML = `
    <div class="ai-avatar">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-width="2" d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 0v20M2 12h20"/>
      </svg>
    </div>
    <div class="typing-dots">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>`;
  box.appendChild(row);
  box.scrollTop = box.scrollHeight;
}

function hideTyping() {
  document.getElementById("typingRow")?.remove();
}

// ─── Send message ─────────────────────────────────────────────────────────────

async function send() {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text || isGenerating) return;

  input.value = "";
  input.style.height = "auto";
  document.getElementById("sendBtn").disabled = true;

  appendMessage("user", text);
  chatHistory.push({ role: "user", text });
  showTyping();
  setGenerating(true);

  try {
    const authToken = localStorage.getItem("token");
    // Snapshot history BEFORE the current user message (already pushed above)
    // We send all previous turns so AI remembers the conversation context
    const historySnapshot = chatHistory.slice(0, -1);
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: JSON.stringify({ message: text, history: historySnapshot }),
    });

    if (res.status === 401 || res.status === 403) {
      logout();
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const reply = data.reply || "No response from server.";

    hideTyping();
    appendMessage("ai", reply);
    chatHistory.push({ role: "ai", text: reply });

    // Save to Recent Chats only on the first message of a new session
    if (!sessionSaved) {
      saveSession(text);
      sessionSaved = true;
    } else {
      // Update existing session's messages
      updateSession();
    }
  } catch (err) {
    hideTyping();
    appendMessage("ai", "⚠️ Could not reach the server. Please try again.");
  } finally {
    setGenerating(false);
  }
}

// ─── Session management ───────────────────────────────────────────────────────

function saveSession(firstMessage) {
  const sessions = JSON.parse(localStorage.getItem("vx_sessions") || "[]");
  const title =
    firstMessage.length > 40 ? firstMessage.slice(0, 40) + "…" : firstMessage;
  const id =
    "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
  currentSessionId = id;
  sessions.unshift({ id, title, ts: Date.now(), messages: [...chatHistory] });
  localStorage.setItem("vx_sessions", JSON.stringify(sessions.slice(0, 20)));
  renderHistory();
}

function updateSession() {
  if (!currentSessionId) return;
  const sessions = JSON.parse(localStorage.getItem("vx_sessions") || "[]");
  const idx = sessions.findIndex((s) => s.id === currentSessionId);
  if (idx !== -1) {
    sessions[idx].messages = [...chatHistory];
    localStorage.setItem("vx_sessions", JSON.stringify(sessions));
  }
}

function useSuggestion(text) {
  document.getElementById("msgInput").value = text;
  document.getElementById("sendBtn").disabled = false;
  send();
}

function newChat() {
  chatHistory = [];
  sessionSaved = false;
  currentSessionId = null;
  const box = document.getElementById("chatBox");
  box.innerHTML = "";
  const empty = document.createElement("div");
  empty.id = "emptyState";
  empty.className = "empty-state";
  empty.innerHTML = `
    <div class="empty-logo">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-width="2" d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 0v20M2 12h20"/>
      </svg>
    </div>
    <h1 class="empty-title">How can I help you?</h1>
    <p class="empty-sub">Ask me anything — I'm Vixy, your AI assistant powered by Gemini.</p>
    <div class="suggestions-grid">
      <button class="suggestion-card" onclick="useSuggestion('Explain quantum computing in simple terms')">
        <span class="suggestion-icon"><i data-lucide="zap"></i></span>
        <div class="suggestion-title">Explain a concept</div>
        <div class="suggestion-desc">Explain quantum computing simply</div>
      </button>
      <button class="suggestion-card" onclick="useSuggestion('Help me write a professional email to my team')">
        <span class="suggestion-icon"><i data-lucide="pen-tool"></i></span>
        <div class="suggestion-title">Help me write</div>
        <div class="suggestion-desc">Draft a professional email</div>
      </button>
      <button class="suggestion-card" onclick="useSuggestion('Write a Python function to sort a list of dictionaries')">
        <span class="suggestion-icon"><i data-lucide="code"></i></span>
        <div class="suggestion-title">Code something</div>
        <div class="suggestion-desc">Python function to sort data</div>
      </button>
      <button class="suggestion-card" onclick="useSuggestion('What are the best productivity tips for developers?')">
        <span class="suggestion-icon">🚀</span>
        <div class="suggestion-title">Get advice</div>
        <div class="suggestion-desc">Productivity tips for developers</div>
      </button>
    </div>`;
  box.appendChild(empty);
  lucide.createIcons();
}

function loadSession(i) {
  const sessions = JSON.parse(localStorage.getItem("vx_sessions") || "[]");
  const session = sessions[i];
  if (!session) return;

  chatHistory = [];
  currentSessionId = session.id;
  sessionSaved = true; // already saved, don't create duplicate

  const box = document.getElementById("chatBox");
  box.innerHTML = "";

  const messages = session.messages || [];
  if (messages.length === 0) {
    newChat();
    return;
  }

  for (const msg of messages) {
    appendMessage(msg.role === "ai" ? "ai" : "user", msg.text);
    chatHistory.push({ role: msg.role, text: msg.text });
  }
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/";
}

// ─── Init ─────────────────────────────────────────────────────────────────────

loadProfile();
renderHistory();
lucide.createIcons();

// Enable/disable send button based on input
document.getElementById("msgInput").addEventListener("input", function () {
  document.getElementById("sendBtn").disabled =
    !this.value.trim() || isGenerating;
});
