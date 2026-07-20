// dashboard.js — Logic for dashboard.html

const token = localStorage.getItem("token");
if (!token) window.location.href = "/";

async function getProfile() {
  try {
    const res = await fetch("/api/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401 || res.status === 403) {
      logout();
      return;
    }

    if (!res.ok) {
      logout();
      return;
    }

    const { user } = await res.json();
    if (!user) {
      logout();
      return;
    }

    // Update header greeting
    const name = user.username || "there";
    document.getElementById("greeting").textContent = name;

    // Sidebar
    document.getElementById("sidebarAvatar").textContent = name
      .charAt(0)
      .toUpperCase();
    document.getElementById("sidebarName").textContent = name;
    document.getElementById("sidebarEmail").textContent = user.email || "—";

    // Stats & info
    document.getElementById("userId").textContent = "#" + user.id;
    document.getElementById("profileId").textContent = user.id;
    document.getElementById("profileUsername").textContent =
      user.username || "—";
    document.getElementById("profileEmail").textContent = user.email || "—";

    // Session time
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    document.getElementById("sessionTime").textContent = `Started at ${now}`;
    document.getElementById("sessionTimeAgo").textContent = `At ${now}`;
  } catch (e) {
    console.error("[dashboard] profile error:", e);
  }
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/";
}

getProfile();
