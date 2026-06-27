document.addEventListener("DOMContentLoaded", async () => {
  // 1. Authentication Check
  const token =
    localStorage.getItem("token") || localStorage.getItem("access_token");
  if (!token) {
    window.location.href = "index.html"; // Redirect to Home if no token
    return;
  }

  // 2. Logout Logic with Custom Modal Integration
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();

      // Using our new beautiful modal instead of native confirm()
      showCustomConfirm(
        "Sign Out",
        "Are you sure you want to log out of your account?",
        "fas fa-sign-out-alt",
        "#ef4444",
        () => {
          localStorage.clear();
          window.location.href = "index.html"; // STRICTLY GO TO HOME PAGE
        },
      );
    });
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
