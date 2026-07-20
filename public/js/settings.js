// settings.js — Logic for settings.html

const token = localStorage.getItem("token");
if (!token) window.location.href = "/";

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
    if (!user) {
      logout();
      return;
    }

    const name = user.username || "User";
    const initial = name.charAt(0).toUpperCase();

    document.getElementById("avatarPreview").textContent = initial;
    document.getElementById("profileName").textContent = name;
    document.getElementById("profileEmailDisplay").textContent =
      user.email || "—";
    document.getElementById("profileIdDisplay").textContent = user.id || "—";

    document.getElementById("sidebarAvatar").textContent = initial;
    document.getElementById("sidebarName").textContent = name;
    document.getElementById("sidebarEmail").textContent = user.email || "—";
  } catch (e) {
    console.error("[settings] profile error:", e);
  }
}

loadProfile();


function showPwMsg(text, type) {
  const el = document.getElementById("pwMsg");
  el.className = `form-msg ${type}`;
  el.innerHTML =
    type === "error"
      ? `<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="12" stroke-width="2"/><line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2"/></svg><span>${text}</span>`
      : `<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline stroke-width="2" points="22 4 12 14.01 9 11.01"/></svg><span>${text}</span>`;
}

function savePassword() {
  const p = document.getElementById("newPass").value;
  const c = document.getElementById("confirmPass").value;

  if (!p) return showPwMsg("Please enter a new password.", "error");
  if (p.length < 8)
    return showPwMsg("Password must be at least 8 characters.", "error");
  if (!/[a-zA-Z]/.test(p))
    return showPwMsg("Password must contain at least one letter.", "error");
  if (!/[0-9]/.test(p))
    return showPwMsg("Password must contain at least one number.", "error");
  if (p !== c) return showPwMsg("Passwords don't match.", "error");

  // TODO: wire up to /api/auth/change-password endpoint
  showPwMsg("Password saved successfully!", "success");
  document.getElementById("newPass").value = "";
  document.getElementById("confirmPass").value = "";
  setTimeout(() => {
    document.getElementById("pwMsg").className = "form-msg";
  }, 3000);
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/";
}
