import { state } from "./core/state.js";
import { logout } from "./core/utils.js";

// Toolbar
import {
  autoResize,
  closeAllDropdowns,
  closeToolsMenu,
  enableWebSearchFromEmpty,
  handleGlobalPointerDown,
  loadSkills,
  setMode,
  setModel,
  toggleModeDropdown,
  toggleModelDropdown,
  toggleSkillActive,
  toggleSkillsDropdown,
  toggleToolsMenu,
  toggleWebSearch,
  toggleWebSearchInMenu,
  triggerFileUpload,
  updateDynamicGreeting,
  updateSendBtn,
  updateWebSearchUI,
} from "./modules/toolbar.js";

// TTS/STT
import {
  initVoices,
  speakText,
  stopSpeaking,
  toggleAutoRead,
  toggleVoiceInput,
  updateAutoReadUI,
  updateVoiceBtnUI,
} from "./modules/voice.js";

// Renderer
import { copyCode, copyText, downloadCode } from "./modules/renderer.js";
import { resetCapGrid, updateCapGridVisibility } from "./modules/renderer.js";

// Chat engine
import {
  handleKey,
  handleFileSelect,
  removeAttachment,
  retryResponse,
  send,
  setStatus,
  stopGeneration,
  useSuggestion,
} from "./modules/chatEngine.js";

// Sessions
import {
  exportSession,
  filterHistory,
  fetchAndSyncSessions,
  handleImportFile,
  loadSession,
  newChat,
  renderHistory,
  togglePin,
} from "./modules/sessions.js";

// Modals
import {
  closeImageModal,
  closeImageModalOnBackdrop,
  closeLightbox,
  closeScrapeModal,
  closeScrapeModalOnBackdrop,
  generateImage,
  handleSlashCommandHint,
  openImageModal,
  openScrapeModal,
  selectAspect,
  selectImgModel,
  setScrapeQuery,
  startScraping,
} from "./modules/modals.js";

// Payment
import {
  closeCheckoutView,
  closeCheckoutViewOnBackdrop,
  closeProModalOnBackdrop,
  fetchUserCredits,
  processSelectedPayment,
  selectPackageCard,
  showProModal,
  switchToFreeModel,
  triggerSimulatedSuccess,
} from "./modules/payment.js";

// ── Small glue helpers (kept here to avoid module cycles) ────

function openImageModalFromMenu() {
  closeToolsMenu();
  openImageModal();
}

function toggleSidebar() {
  if (window.innerWidth <= 768) {
    document.querySelector(".sidebar").classList.toggle("open");
    document.querySelector(".sidebar-overlay").classList.toggle("open");
    return;
  }
  const collapsed = document.body.classList.toggle("sidebar-collapsed");
  localStorage.setItem("vx_sidebar_collapsed", collapsed ? "1" : "0");
}

// ── Auth hook ─────────────────────
window.__onAuthReady = function (user, token, profile) {
  state.authToken = token;
  state.currentUserId = profile?.id || user?.uid || null;
  const name = profile?.username || "User";
  state.currentUserName = name;
  const initial = name.charAt(0).toUpperCase();
  const el = (id) => document.getElementById(id);
  if (el("sidebarAvatar")) el("sidebarAvatar").textContent = initial;
  if (el("sidebarName")) el("sidebarName").textContent = name;
  if (el("sidebarEmail"))
    el("sidebarEmail").textContent = profile?.email || "—";

  updateDynamicGreeting(name);

  // Fetch credits and sessions from server
  fetchUserCredits();
  loadSkills();
  fetchAndSyncSessions().then(() => renderHistory());
};

// ── Unified global listeners ─────────────────────────────────

// Single outside-click dispatcher closing every dropdown family
document.addEventListener("click", handleGlobalPointerDown);

document.addEventListener(
  "touchstart",
  (e) => {
    const toolsWrap = document.getElementById("toolsMenuWrap");
    if (toolsWrap && !toolsWrap.contains(e.target)) {
      const dd = document.getElementById("toolsMenuDropdown");
      if (dd && dd.classList.contains("open")) {
        closeToolsMenu();
      }
    }
  },
  { passive: true },
);

// Delegated content actions. DOMPurify strips inline onclick attributes
// from generated content, so copy/download/speak buttons are wired here.
document.addEventListener("click", function (e) {
  const dlBtn = e.target.closest(".code-dl-btn");
  if (dlBtn) {
    downloadCode(dlBtn);
    return;
  }
  const copyBtn = e.target.closest(".code-copy-btn");
  if (copyBtn) {
    copyCode(copyBtn);
    return;
  }
  // .speak-btn is also a .msg-action-btn — check it BEFORE the generic action
  const speakBtn = e.target.closest(".speak-btn");
  if (speakBtn) {
    speakText(speakBtn);
    return;
  }
  const retryBtn = e.target.closest(".retry-btn");
  if (retryBtn) {
    retryResponse(retryBtn);
    return;
  }
  const actionBtn = e.target.closest(".msg-action-btn");
  if (
    actionBtn &&
    actionBtn.tagName === "BUTTON" &&
    actionBtn.hasAttribute("data-text")
  ) {
    copyText(actionBtn);
    return;
  }
});

// Image lightbox delegation (generated images & user-uploaded previews)
document.getElementById("chatBox").addEventListener("click", (e) => {
  const img = e.target.closest(".gen-img-click");
  if (img) openLightbox(img.src);

  const uImg = e.target.closest(".user-bubble-img");
  if (uImg) openLightbox(uImg.src);
});

// Escape closes any open overlay and stops playback
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    stopSpeaking();
    closeImageModal();
    closeLightbox();
    closeScrapeModal();
  }
});

// Unified composer input handler: send-button state, empty-state cap
// cards, and slash-command hints (/scraping).
document.getElementById("msgInput").addEventListener("input", function () {
  updateSendBtn();
  updateCapGridVisibility();
  handleSlashCommandHint(this.value);
});

// Enter in the scrape URL input starts scraping
document.getElementById("scrapeUrlInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    startScraping();
  }
});

// Network connectivity → status badge
window.addEventListener("offline", () => setStatus("offline"));
window.addEventListener("online", () => {
  if (!state.isGenerating) setStatus("ready");
});

// ── App initialization ────

// Single DOMContentLoaded initializer for the chat page
document.addEventListener("DOMContentLoaded", () => {
  updateWebSearchUI();

  // Init UI to match persisted mode & model on page load
  setMode(state.currentMode);
  setModel(state.currentModel);
  setStatus(navigator.onLine ? "ready" : "offline");
  document.documentElement.lang = state.currentLang;

  if (window.location.hash === "#topup") {
    setTimeout(() => showProModal(), 600);
  }

  updateAutoReadUI();
  updateVoiceBtnUI();
});

initVoices();
renderHistory();
updateDynamicGreeting();
lucide.createIcons();

if (
  window.innerWidth > 768 &&
  localStorage.getItem("vx_sidebar_collapsed") === "1"
) {
  document.body.classList.add("sidebar-collapsed");
}

// ── Window bindings for inline HTML handlers ─────────────────
Object.assign(window, {
  // Toolbar / selectors
  autoResize,
  closeAllDropdowns,
  enableWebSearchFromEmpty,
  setMode,
  setModel,
  toggleAutoRead,
  toggleModeDropdown,
  toggleModelDropdown,
  toggleSkillActive,
  toggleSkillsDropdown,
  toggleToolsMenu,
  toggleVoiceInput,
  toggleWebSearch,
  toggleWebSearchInMenu,
  triggerFileUpload,

  // Composer / engine
  handleFileSelect,
  handleKey,
  removeAttachment,
  retryResponse,
  send,
  stopGeneration,
  useSuggestion,

  // Sessions
  exportSession,
  filterHistory,
  handleImportFile,
  loadSession,
  newChat,
  togglePin,
  toggleSidebar,

  // Renderer actions
  copyCode,
  copyText,
  downloadCode,
  speakText,

  // Modals
  closeCheckoutView,
  closeCheckoutViewOnBackdrop,
  closeImageModal,
  closeImageModalOnBackdrop,
  closeLightbox,
  closeScrapeModal,
  closeScrapeModalOnBackdrop,
  generateImage,
  openImageModalFromMenu,
  openScrapeModal,
  selectAspect,
  selectImgModel,
  setScrapeQuery,
  startScraping,

  // Payment
  closeProModalOnBackdrop,
  processSelectedPayment,
  selectPackageCard,
  showProModal,
  switchToFreeModel,
  triggerSimulatedSuccess,

  // Misc
  logout,
});
