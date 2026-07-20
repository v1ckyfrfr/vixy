// auth.js — Logic for index.html (login / signup page)

// Redirect to dashboard if already logged in
(function () {
  const token = localStorage.getItem("token");
  if (token) window.location.href = "/dashboard.html";
})();

function switchTab(tab) {
  const isLogin = tab === "login";
  document.getElementById("tabLogin").classList.toggle("active", isLogin);
  document.getElementById("tabSignup").classList.toggle("active", !isLogin);
  document.getElementById("formLogin").classList.toggle("active", isLogin);
  document.getElementById("formSignup").classList.toggle("active", !isLogin);
  clearMessages();
}

function clearMessages() {
  ["loginMsg", "signupMsg"].forEach((id) => {
    const el = document.getElementById(id);
    el.className = "form-msg";
    el.innerHTML = "";
  });
}

function showMsg(id, text, type) {
  const el = document.getElementById(id);
  const icon =
    type === "error"
      ? '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="12" stroke-width="2"/><line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2"/></svg>'
      : '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline stroke-width="2" points="22 4 12 14.01 9 11.01"/></svg>';
  el.className = `form-msg ${type}`;
  el.innerHTML = icon + "<span>" + text + "</span>";
}

function togglePassword(id, btn) {
  const input = document.getElementById(id);
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";
  btn.innerHTML = isPassword
    ? '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23" stroke-width="2"/></svg>'
    : '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3" stroke-width="2"/></svg>';
}

function checkStrength(input) {
  const pw = input.value;
  const bar = document.getElementById("pwStrengthBar");
  const hint = document.getElementById("pwHint");
  const container = document.getElementById("pwStrength");

  if (!pw) {
    container.classList.remove("visible");
    hint.textContent = "";
    return;
  }

  container.classList.add("visible");

  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const levels = [
    { label: "Too short", color: "#ef4444", width: "20%" },
    { label: "Weak", color: "#f97316", width: "40%" },
    { label: "Fair", color: "#eab308", width: "60%" },
    { label: "Good", color: "#22c55e", width: "80%" },
    { label: "Strong", color: "#10a37f", width: "100%" },
  ];

  const lvl = levels[Math.min(score, 4)];
  bar.style.width = lvl.width;
  bar.style.background = lvl.color;
  hint.textContent = lvl.label;
  hint.style.color = lvl.color;
}

function setLoading(prefix, loading) {
  const btn = document.getElementById(prefix + "Btn");
  const txt = document.getElementById(prefix + "BtnText");
  const spinner = document.getElementById(prefix + "Spinner");
  btn.disabled = loading;
  txt.style.display = loading ? "none" : "inline";
  spinner.style.display = loading ? "block" : "none";
}

async function signup() {
  const username = document.getElementById("su_username").value.trim();
  const email = document.getElementById("su_email").value.trim();
  const password = document.getElementById("su_password").value;

  if (!username || !email || !password) {
    return showMsg("signupMsg", "Please fill in all fields.", "error");
  }
  if (password.length < 8) {
    return showMsg(
      "signupMsg",
      "Password must be at least 8 characters.",
      "error",
    );
  }

  setLoading("signup", true);

  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showMsg(
        "signupMsg",
        data.message || "Signup failed. Please try again.",
        "error",
      );
    } else {
      showMsg("signupMsg", "Account created! You can now sign in.", "success");
      document.getElementById("su_username").value = "";
      document.getElementById("su_email").value = "";
      document.getElementById("su_password").value = "";
      setTimeout(() => switchTab("login"), 1800);
    }
  } catch (err) {
    showMsg("signupMsg", "Network error. Please try again.", "error");
  } finally {
    setLoading("signup", false);
  }
}

async function login() {
  const email = document.getElementById("li_email").value.trim();
  const password = document.getElementById("li_password").value;

  if (!email || !password) {
    return showMsg("loginMsg", "Please fill in all fields.", "error");
  }

  setLoading("login", true);

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showMsg("loginMsg", data.message || "Invalid credentials.", "error");
      setLoading("login", false);
      return;
    }

    // Store token in localStorage so it persists across tabs and refreshes
    localStorage.setItem("token", data.token);
    window.location.href = "/dashboard.html";
  } catch (err) {
    showMsg("loginMsg", "Network error. Please try again.", "error");
    setLoading("login", false);
  }
}

// Allow Enter key to submit
document.addEventListener("keydown", function (e) {
  if (e.key !== "Enter") return;
  const loginActive = document
    .getElementById("formLogin")
    .classList.contains("active");
  if (loginActive) login();
  else signup();
});
