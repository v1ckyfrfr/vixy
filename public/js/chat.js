const token = localStorage.getItem("token");
if (!token) window.location.href = "/";

let isGenerating = false;
let chatHistory = [];
let sessionSaved = false;
let currentSessionId = null;

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

loadProfile();

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

renderHistory();
lucide.createIcons();

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toggleSidebar() {
  document.querySelector(".sidebar").classList.toggle("open");
  document.querySelector(".sidebar-overlay").classList.toggle("open");
}

function removeEmptyState() {
  document.getElementById("emptyState")?.remove();
}

function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 160) + "px";
}

document.getElementById("msgInput").addEventListener("input", function () {
  updateSendBtn();
});

function handleKey(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const hasText = document.getElementById("msgInput").value.trim();
    if (!isGenerating && (hasText || attachedFile)) send();
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
    updateSendBtn();
    input.disabled = false;
  }
}

function stopGeneration() {
  setGenerating(false);
  hideTyping();
  appendMessage("ai", "[Generation stopped]");
}

function appendMessage(role, text, fileInfo) {
  removeEmptyState();
  const box = document.getElementById("chatBox");
  const isUser = role === "user";

  if (isUser) {
    const div = document.createElement("div");
    div.className = "msg-group";
    let innerHtml = "";

    if (fileInfo) {
      if (fileInfo.isImage) {
        innerHtml += `<img class="user-bubble-img" src="${fileInfo.dataUrl}" alt="${escapeHtml(fileInfo.name)}" />`;
      } else {
        innerHtml += `<div class="msg-file-badge">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline stroke-width="2" points="14 2 14 8 20 8"/></svg>
                ${escapeHtml(fileInfo.name)} <span style="color:var(--text-muted);margin-left:4px">${fileInfo.size}</span>
              </div>`;
      }
    }

    if (text) {
      innerHtml += `<div>${escapeHtml(text).replace(/\n/g, "<br>")}</div>`;
    }

    div.innerHTML = `<div class="msg-user"><div class="msg-user-bubble">${innerHtml}</div></div>`;
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
    requestAnimationFrame(() => {
      div.querySelectorAll("pre code").forEach((block) => {
        if (typeof hljs !== "undefined") {
          hljs.highlightElement(block);
        }
      });
    });
  }
  box.scrollTop = box.scrollHeight;
}

function formatResponse(text) {
  const lines = text.split("\n");
  let html = "";
  let inCode = false;
  let codeLang = "";
  let codeLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = line.match(/^```(\w*)/);

    if (!inCode && fenceMatch) {
      inCode = true;
      codeLang = fenceMatch[1] || "";
      codeLines = [];
      continue;
    }

    if (inCode && line.startsWith("```")) {
      const langAttr = codeLang
        ? ` class="language-${codeLang}"`
        : ' class="plaintext"';
      const langLabel = codeLang || "code";
      const escaped = codeLines
        .join("\n")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      html += `<div class="code-block-wrap"><div class="code-block-header"><span class="code-lang-label">${escapeHtml(langLabel)}</span><button class="code-copy-btn" onclick="copyCode(this)">Copy</button></div><pre><code${langAttr}>${escaped}</code></pre></div>`;
      inCode = false;
      codeLang = "";
      codeLines = [];
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    let escaped = line
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");

    html += escaped + "<br>";
  }

  if (inCode && codeLines.length) {
    const langAttr = codeLang
      ? ` class="language-${codeLang}"`
      : ' class="plaintext"';
    const langLabel = codeLang || "code";
    const escaped = codeLines
      .join("\n")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    html += `<div class="code-block-wrap"><div class="code-block-header"><span class="code-lang-label">${escapeHtml(langLabel)}</span><button class="code-copy-btn" onclick="copyCode(this)">Copy</button></div><pre><code${langAttr}>${escaped}</code></pre></div>`;
  }

  return html;
}

function copyCode(btn) {
  const code = btn.closest(".code-block-wrap").querySelector("code");
  const text = code.textContent;
  navigator.clipboard
    .writeText(text)
    .then(() => {
      btn.textContent = "Copied!";
      setTimeout(() => (btn.textContent = "Copy"), 2000);
    })
    .catch(() => {
      btn.textContent = "Error";
      setTimeout(() => (btn.textContent = "Copy"), 2000);
    });
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

let attachedFile = null;
let attachedFileInfo = null;

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function updateSendBtn() {
  const hasText = document.getElementById("msgInput").value.trim();
  document.getElementById("sendBtn").disabled =
    (!hasText && !attachedFile) || isGenerating;
}

function handleFileSelect(input) {
  const file = input.files[0];
  if (!file) return;

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    alert(`File terlalu besar (${formatBytes(file.size)}). Maksimal 10 MB.`);
    input.value = "";
    return;
  }

  attachedFile = file;
  const isImage = file.type.startsWith("image/");

  const showPreview = (dataUrl) => {
    attachedFileInfo = {
      name: file.name,
      size: formatBytes(file.size),
      isImage,
      dataUrl,
    };

    const thumbEl = document.getElementById("filePreviewThumb");
    if (isImage) {
      thumbEl.innerHTML = `<img class="file-thumb" src="${dataUrl}" alt="preview" />`;
    } else {
      const svgFile =
        '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline stroke-width="2" points="14 2 14 8 20 8"/></svg>';
      const svgPdf =
        '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline stroke-width="2" points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13" stroke-width="2"/><line x1="16" y1="17" x2="8" y2="17" stroke-width="2"/><polyline stroke-width="2" points="10 9 9 9 8 9"/></svg>';
      let iconSvg = svgFile;
      if (file.type === "application/pdf") iconSvg = svgPdf;
      thumbEl.innerHTML = `<div class="file-doc-icon">${iconSvg}</div>`;
    }
    document.getElementById("filePreviewName").textContent = file.name;
    document.getElementById("filePreviewSize").textContent = formatBytes(
      file.size,
    );
    document.getElementById("filePreviewBar").classList.add("visible");
    document.getElementById("attachBtn").classList.add("has-file");
    updateSendBtn();
  };

  if (isImage) {
    const reader = new FileReader();
    reader.onload = (e) => showPreview(e.target.result);
    reader.readAsDataURL(file);
  } else {
    showPreview(null);
  }
}

function removeAttachment() {
  attachedFile = null;
  attachedFileInfo = null;
  document.getElementById("fileInput").value = "";
  document.getElementById("filePreviewBar").classList.remove("visible");
  document.getElementById("attachBtn").classList.remove("has-file");
  updateSendBtn();
}

async function send() {
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if ((!text && !attachedFile) || isGenerating) return;

  const fileToSend = attachedFile;
  const fileInfoSnap = attachedFileInfo ? { ...attachedFileInfo } : null;

  input.value = "";
  input.style.height = "auto";
  document.getElementById("sendBtn").disabled = true;
  if (fileToSend) removeAttachment();

  appendMessage("user", text, fileInfoSnap);
  const historyLabel = fileToSend
    ? `[File: ${fileToSend.name}]${text ? " " + text : ""}`
    : text;
  chatHistory.push({ role: "user", text: historyLabel });
  showTyping();
  setGenerating(true);

  try {
    const authToken = localStorage.getItem("token");
    const historySnapshot = chatHistory.slice(0, -1);

    let res;
    if (fileToSend) {
      const fd = new FormData();
      fd.append("file", fileToSend);
      if (text) fd.append("message", text);
      fd.append("history", JSON.stringify(historySnapshot));
      res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        body: fd,
      });
    } else {
      res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        body: JSON.stringify({ message: text, history: historySnapshot }),
      });
    }

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

    if (!sessionSaved) {
      saveSession(text || `[file] ${fileToSend?.name}`);
      sessionSaved = true;
    } else {
      updateSession();
    }
  } catch (err) {
    hideTyping();
    appendMessage("ai", "[!] Could not reach the server. Please try again.");
  } finally {
    setGenerating(false);
  }
}

function saveSession(firstMessage) {
  const sessions = JSON.parse(localStorage.getItem("vx_sessions") || "[]");
  const title =
    firstMessage.length > 40 ? firstMessage.slice(0, 40) + "…" : firstMessage;
  const id =
    "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
  currentSessionId = id;
  sessions.unshift({
    id,
    title,
    ts: Date.now(),
    messages: [...chatHistory],
  });
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
          <span class="suggestion-icon"><i data-lucide="rocket"></i></span>
          <div class="suggestion-title">Get advice</div>
          <div class="suggestion-desc">Productivity tips for developers</div>
        </button>
      </div>`;
  box.appendChild(empty);
}

function loadSession(i) {
  const sessions = JSON.parse(localStorage.getItem("vx_sessions") || "[]");
  const session = sessions[i];
  if (!session) return;

  chatHistory = [];
  currentSessionId = session.id;
  sessionSaved = true;

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

let selectedAspectRatio = "1:1";

function openImageModal() {
  document.getElementById("imgModalBackdrop").classList.add("open");
  document.getElementById("imgPromptInput").focus();
}

function closeImageModal() {
  document.getElementById("imgModalBackdrop").classList.remove("open");
  document.getElementById("imgPromptInput").value = "";
  resetImgGenerateBtn();
  const err = document.getElementById("imgModalError");
  if (err) err.remove();

  document
    .querySelectorAll(".aspect-chip")
    .forEach((c) => c.classList.remove("active"));
  document
    .querySelector('.aspect-chip[data-ratio="1:1"]')
    .classList.add("active");
  selectedAspectRatio = "1:1";
}

function closeImageModalOnBackdrop(e) {
  if (e.target === document.getElementById("imgModalBackdrop")) {
    closeImageModal();
  }
}

function selectAspect(el) {
  document
    .querySelectorAll(".aspect-chip")
    .forEach((c) => c.classList.remove("active"));
  el.classList.add("active");
  selectedAspectRatio = el.dataset.ratio;
}

function resetImgGenerateBtn() {
  const btn = document.getElementById("imgGenerateBtn");
  btn.classList.remove("loading");
  btn.disabled = false;
}

async function generateImage() {
  const prompt = document.getElementById("imgPromptInput").value.trim();
  if (!prompt) {
    document.getElementById("imgPromptInput").focus();
    return;
  }

  const btn = document.getElementById("imgGenerateBtn");
  btn.classList.add("loading");
  btn.disabled = true;
  const existingErr = document.getElementById("imgModalError");
  if (existingErr) existingErr.remove();

  try {
    const authToken = localStorage.getItem("token");
    const res = await fetch("/api/ai/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: JSON.stringify({ prompt, aspectRatio: selectedAspectRatio }),
    });

    if (res.status === 401 || res.status === 403) {
      logout();
      return;
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || `HTTP ${res.status}`);
    }

    const { imageBase64, mimeType } = data;
    const dataUrl = `data:${mimeType};base64,${imageBase64}`;

    closeImageModal();
    appendImageMessage(prompt, dataUrl);
    chatHistory.push({
      role: "user",
      text: `[Image generated: ${prompt}]`,
    });
    chatHistory.push({
      role: "ai",
      text: `[Generated image for: ${prompt}]`,
    });

    if (!sessionSaved) {
      saveSession(`[img] ${prompt}`);
      sessionSaved = true;
    } else {
      updateSession();
    }
  } catch (err) {
    resetImgGenerateBtn();
    const errDiv = document.createElement("div");
    errDiv.id = "imgModalError";
    errDiv.className = "img-modal-error";
    const isQuota =
      err.message &&
      (err.message.includes("quota") ||
        err.message.includes("rate limit") ||
        err.message.includes("429"));
    errDiv.innerHTML = isQuota
      ? `⚠️ <strong>API quota exceeded.</strong> Image generation requires a paid Gemini API plan. <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Upgrade your API key</a> to enable this feature.`
      : `⚠️ ${err.message || "Image generation failed. Please try again."}`;
    const actions = document.querySelector(".img-modal-actions");
    actions.parentNode.insertBefore(errDiv, actions);
  }
}

function appendImageMessage(prompt, dataUrl) {
  removeEmptyState();
  const box = document.getElementById("chatBox");

  const userDiv = document.createElement("div");
  userDiv.className = "msg-group";
  userDiv.innerHTML = `
          <div class="msg-user">
            <div class="msg-user-bubble">
              <span class="msg-file-badge">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.5" stroke-width="2"/><polyline stroke-width="2" points="21 15 16 10 5 21"/></svg>
                Generate image
              </span>
              <div>${escapeHtml(prompt)}</div>
            </div>
          </div>`;
  box.appendChild(userDiv);

  const aiDiv = document.createElement("div");
  aiDiv.className = "msg-group";
  aiDiv.innerHTML = `
          <div class="msg-ai">
            <div class="ai-avatar">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-width="2" d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 0v20M2 12h20"/>
              </svg>
            </div>
            <div class="ai-content">
              <div class="ai-name">Vixy</div>
              <div class="ai-bubble">
                Ini gambar yang aku buat berdasarkan promptmu:
                <div class="msg-image-wrap" id="gen-img-wrap-${Date.now()}">
                  <img class="gen-img-click" src="${dataUrl}" alt="Generated: ${escapeHtml(prompt)}" />
                  <div class="msg-image-caption">Aspect ratio: ${selectedAspectRatio} &middot; Klik untuk memperbesar</div>
                </div>
              </div>
              <div class="msg-actions" style="opacity:1">
                <a class="msg-action-btn" href="${dataUrl}" download="vixy-${Date.now()}.png">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-width="2" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline stroke-width="2" points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3" stroke-width="2"/>
                  </svg>
                  Download
                </a>
              </div>
            </div>
          </div>`;
  box.appendChild(aiDiv);
  box.scrollTop = box.scrollHeight;
}

function openLightbox(src) {
  const lb = document.getElementById("imgLightbox");
  document.getElementById("lightboxImg").src = src;
  document.getElementById("lightboxDl").href = src;
  lb.classList.add("open");
}

function closeLightbox() {
  document.getElementById("imgLightbox").classList.remove("open");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeImageModal();
    closeLightbox();
  }
});

document.getElementById("chatBox").addEventListener("click", (e) => {
  const img = e.target.closest(".gen-img-click");
  if (img) openLightbox(img.src);

  const uImg = e.target.closest(".user-bubble-img");
  if (uImg) openLightbox(uImg.src);
});
