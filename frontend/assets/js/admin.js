document.addEventListener("DOMContentLoaded", async () => {
  const usersTableBody = document.getElementById("users-table-body");
  const totalUsersCount = document.getElementById("total-users-count");

  const pendingTableBody = document.getElementById("pending-users-table-body");
  const pendingUsersCount = document.getElementById("pending-users-count");

  // 1. Load All Active/Approved Users
  async function loadUsers() {
    if (!usersTableBody) return;

    try {
      const users = await api.get("/users/");

      // Filter only approved users for the main table (is_approved === 1)
      const approvedUsers = users.filter((user) => user.is_approved === 1);

      if (totalUsersCount) {
        totalUsersCount.textContent = approvedUsers.length;
      }

      usersTableBody.innerHTML = "";

      if (approvedUsers.length === 0) {
        usersTableBody.innerHTML =
          '<tr><td colspan="5" style="text-align: center;">No active users found.</td></tr>';
        return;
      }

      approvedUsers.forEach((user) => {
        const tr = document.createElement("tr");
        let roleColor = "var(--text-main)";
        if (user.role === "admin") roleColor = "var(--primary-color)";
        else if (user.role === "teacher") roleColor = "#10b981";

        tr.innerHTML = `
                    <td>#${user.id}</td>
                    <td style="font-weight: 600;">${user.name}</td>
                    <td style="color: var(--text-muted);">${user.email}</td>
                    <td style="color: ${roleColor}; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px;">${user.role}</td>
                    <td>
                        <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: #ef4444; border-color: rgba(239,68,68,0.3);" onclick="deleteUser(${user.id}, '${user.name}')">Delete</button>
                    </td>
                `;
        usersTableBody.appendChild(tr);
      });
    } catch (err) {
      console.error("Failed to load users:", err);
      usersTableBody.innerHTML =
        '<tr><td colspan="5" style="color: #ef4444; text-align: center;">Error loading users.</td></tr>';
    }
  }

  // 2. Load Pending Users
  async function loadPendingUsers() {
    if (!pendingTableBody) return;

    try {
      const pendingUsers = await api.get("/users/pending");

      if (pendingUsersCount) {
        pendingUsersCount.textContent = pendingUsers.length;
      }

      pendingTableBody.innerHTML = "";

      if (pendingUsers.length === 0) {
        pendingTableBody.innerHTML =
          '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No pending requests.</td></tr>';
        return;
      }

      pendingUsers.forEach((user) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
                    <td>#${user.id}</td>
                    <td style="font-weight: 600;">${user.name}</td>
                    <td style="color: var(--text-muted);">${user.email}</td>
                    <td><span style="background: rgba(239, 160, 11, 0.1); color: #efa00b; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">Pending</span></td>
                    <td style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;" onclick="approveUser(${user.id}, '${user.name}')">Approve</button>
                        <button class="btn btn-outline" style="padding: 0.25rem 0.75rem; font-size: 0.75rem; color: #ef4444; border-color: rgba(239,68,68,0.3);" onclick="deleteUser(${user.id}, '${user.name}')">Reject</button>
                    </td>
                `;
        pendingTableBody.appendChild(tr);
      });
    } catch (error) {
      console.error("Failed to load pending users:", error);
      pendingTableBody.innerHTML =
        '<tr><td colspan="5" style="color: #ef4444; text-align: center;">Error loading pending users.</td></tr>';
    }
  }

  // Call both functions on load
  loadUsers();
  loadPendingUsers();

  // 3. Approve User Function (Attached to window so HTML inline onclick can access it)
  window.approveUser = async function (userId, userName) {
    if (
      !confirm(`Are you sure you want to approve the account for ${userName}?`)
    ) {
      return;
    }

    try {
      // FIX: Checking both keys for the token
      const token =
        localStorage.getItem("token") || localStorage.getItem("access_token");
      if (!token) {
        alert("Authentication error: No token found. Please log in again.");
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/users/${userId}/approve`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Approval failed");
      }

      alert(`${userName}'s account has been successfully approved!`);

      // Refresh both tables
      loadPendingUsers();
      loadUsers();
    } catch (err) {
      alert("Error approving user: " + err.message);
    }
  };

  // 4. Delete / Reject User Function
  window.deleteUser = async function (userId, userName) {
    if (
      !confirm(
        `Are you sure you want to permanently delete/reject the profile for ${userName}?`,
      )
    ) {
      return;
    }

    try {
      // FIX: Checking both keys for the token
      const token =
        localStorage.getItem("token") || localStorage.getItem("access_token");
      if (!token) {
        alert("Authentication error: No token found. Please log in again.");
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Deletion failed");
      }

      alert(`User ${userName} deleted successfully.`);

      // Refresh both tables
      loadUsers();
      loadPendingUsers();
    } catch (err) {
      alert("Error deleting user: " + err.message);
    }
  };
});
