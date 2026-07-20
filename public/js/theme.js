// Apply theme IMMEDIATELY on parse — before any paint (prevents flash)
(function () {
  const saved = localStorage.getItem("theme");
  // Default is dark — only add 'light' class if explicitly saved as light
  if (saved === "light") {
    document.documentElement.classList.add("light");
  } else {
    // Ensure dark mode is the default (remove 'light' if present)
    document.documentElement.classList.remove("light");
  }
})();

// Sync toggle state after DOM is ready (only relevant in settings.html)
document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.getElementById("darkToggle");
  if (!toggle) return;

  const savedTheme = localStorage.getItem("theme");
  toggle.checked = savedTheme !== "light";
});


function toggleTheme() {
  const isCurrentlyLight = document.documentElement.classList.contains("light");

  if (isCurrentlyLight) {
    document.documentElement.classList.remove("light");
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.classList.add("light");
    localStorage.setItem("theme", "light");
  }

  const toggle = document.getElementById("darkToggle");
  if (toggle) {
    toggle.checked = localStorage.getItem("theme") !== "light";
  }

  if (typeof showToast === "function") {
    showToast(isCurrentlyLight ? "Dark mode enabled" : "Light mode enabled");
  }
}

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open');
}
