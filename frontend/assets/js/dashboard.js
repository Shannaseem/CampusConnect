document.addEventListener("DOMContentLoaded", async () => {
  // 1. Authentication Check
  const token =
    localStorage.getItem("token") || localStorage.getItem("access_token");
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  // ==========================================
  // BULLETPROOF DYNAMIC POPUPS (No HTML needed)
  // ==========================================
  window.showCustomAlert = function (
    title,
    message,
    iconClass = "fas fa-check-circle",
    iconColor = "#10b981",
  ) {
    let modal = document.getElementById("dynamic-alert-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "dynamic-alert-modal";
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
          <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.6); z-index: 99999; backdrop-filter: blur(4px);">
              <div style="background: white; border-radius: 16px; padding: 2.5rem 2rem; max-width: 420px; width: 90%; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.25);">
                  <div style="font-size: 3.5rem; margin-bottom: 1.25rem; color: ${iconColor};"><i class="${iconClass}"></i></div>
                  <h3 style="font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem; font-family: 'Outfit', sans-serif;">${title}</h3>
                  <p style="color: #64748b; font-size: 1rem; margin-bottom: 2rem; font-family: 'Inter', sans-serif;">${message}</p>
                  <button onclick="document.getElementById('dynamic-alert-modal').style.display='none'" style="padding: 10px 20px; width: 100%; background: ${iconColor}; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem;">Okay, got it</button>
              </div>
          </div>
      `;
    modal.style.display = "block";
  };

  window.showCustomConfirm = function (
    title,
    message,
    iconClass,
    iconColor,
    onConfirm,
  ) {
    let modal = document.getElementById("dynamic-confirm-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "dynamic-confirm-modal";
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
          <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.6); z-index: 99999; backdrop-filter: blur(4px);">
              <div style="background: white; border-radius: 16px; padding: 2.5rem 2rem; max-width: 420px; width: 90%; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.25);">
                  <div style="font-size: 3.5rem; margin-bottom: 1.25rem; color: ${iconColor};"><i class="${iconClass}"></i></div>
                  <h3 style="font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem; font-family: 'Outfit', sans-serif;">${title}</h3>
                  <p style="color: #64748b; font-size: 1rem; margin-bottom: 2rem; font-family: 'Inter', sans-serif;">${message}</p>
                  <div style="display: flex; gap: 1rem; justify-content: center;">
                      <button onclick="document.getElementById('dynamic-confirm-modal').style.display='none'" style="flex: 1; padding: 10px; background: transparent; color: #64748b; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-weight: 600;">Cancel</button>
                      <button id="dynamic-confirm-yes" style="flex: 1; padding: 10px; background: ${iconColor}; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Confirm</button>
                  </div>
              </div>
          </div>
      `;
    modal.style.display = "block";
    document.getElementById("dynamic-confirm-yes").onclick = function () {
      modal.style.display = "none";
      onConfirm();
    };
  };

  // 2. Safe Logout Logic
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    // Purane click events remove karne ke liye inline function
    logoutBtn.onclick = (e) => {
      e.preventDefault();
      window.showCustomConfirm(
        "Sign Out",
        "Are you sure you want to log out of your account?",
        "fas fa-sign-out-alt",
        "#ef4444",
        () => {
          localStorage.clear();
          window.location.href = "index.html";
        },
      );
    };
  }

  // 3. Fetch User Details & Populate Dashboard Header
  try {
    const user = await api.get("/users/me");
    window.currentUser = user;

    const currentPage = window.location.pathname.split("/").pop();
    let userRole =
      typeof user.role === "object" && user.role.value
        ? user.role.value
        : user.role;
    userRole = String(userRole).toLowerCase();

    if (
      currentPage === "teacher.html" &&
      userRole !== "teacher" &&
      userRole !== "admin"
    ) {
      window.location.href = "student.html";
      return;
    } else if (currentPage === "admin.html" && userRole !== "admin") {
      window.location.href = "student.html";
      return;
    }

    const nameDisplay = document.getElementById("user-name-display");
    if (nameDisplay) nameDisplay.textContent = user.name;

    const roleDisplay = document.getElementById("user-role-display");
    if (roleDisplay) roleDisplay.textContent = userRole.toUpperCase();

    const avatarInitial = document.getElementById("user-avatar-initial");
    if (avatarInitial && user.name) {
      avatarInitial.textContent = user.name.charAt(0).toUpperCase();
    }
  } catch (err) {
    console.error("Failed to fetch user profile", err);
    localStorage.clear();
    window.location.href = "index.html";
  }
});
