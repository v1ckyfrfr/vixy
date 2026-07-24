(function () {
  const saved = localStorage.getItem("theme");
  if (saved === "light") {
    document.documentElement.classList.add("light");
  } else {
    document.documentElement.classList.remove("light");
  }
})();
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
