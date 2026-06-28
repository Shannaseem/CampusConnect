document.addEventListener("DOMContentLoaded", async () => {
  // DOM Elements
  const usersTableBody = document.getElementById("users-table-body");
  const totalUsersCount = document.getElementById("total-users-count");
  const pendingTableBody = document.getElementById("pending-users-table-body");
  const overviewPendingBody = document.getElementById("overview-pending-body");
  const overviewPendingCount = document.getElementById(
    "overview-pending-count",
  );
  const subjectsTableBody = document.getElementById("subjects-table-body");
  const totalSubjectsCount = document.getElementById("total-subjects-count");
  const totalTeachersCount = document.getElementById("total-teachers-count");
  const subjTeacherSelect = document.getElementById("subj-teacher");
  const createSubjectForm = document.getElementById("create-subject-form");

  let allTeachers = [];
  let lastPendingCount = -1;

  // Mobile Sidebar Setup
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebar-toggle");

  if (sidebar && !document.querySelector(".sidebar-overlay")) {
    const sidebarOverlay = document.createElement("div");
    sidebarOverlay.className = "sidebar-overlay";
    document.body.appendChild(sidebarOverlay);

    if (sidebarToggle) {
      sidebarToggle.addEventListener("click", () => {
        if (window.innerWidth <= 768) {
          sidebar.classList.toggle("mobile-open");
          sidebarOverlay.classList.toggle("show");
        } else {
          sidebar.classList.toggle("collapsed");
        }
      });
    }
    sidebarOverlay.addEventListener("click", () => {
      sidebar.classList.remove("mobile-open");
      sidebarOverlay.classList.remove("show");
    });
  }

  // Fallback if modals aren't loaded somehow
  if (!window.showCustomAlert) {
    window.showCustomAlert = (t, m) => alert(t + ": " + m);
  }
  if (!window.showCustomConfirm) {
    window.showCustomConfirm = (t, m, c, clr, cb) => {
      if (confirm(t + "\n" + m)) cb();
    };
  }

  // Safe String Escaper for HTML Attributes
  function escapeQuotes(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, "&quot;");
  }

  window.switchAdminTab = function (tabName, element) {
    document
      .querySelectorAll(".tab-content")
      .forEach((tab) => tab.classList.remove("active"));
    document
      .querySelectorAll(".nav-item")
      .forEach((item) => item.classList.remove("active"));
    document.getElementById(`tab-${tabName}`).classList.add("active");
    if (element) element.classList.add("active");

    const titleMap = {
      overview: "Overview",
      pending: "Pending Approvals",
      users: "Manage Users",
      subjects: "Manage Subjects",
    };
    document.getElementById("panel-title").textContent =
      titleMap[tabName] || "Overview";

    if (window.innerWidth <= 768 && sidebar) {
      sidebar.classList.remove("mobile-open");
      document.querySelector(".sidebar-overlay").classList.remove("show");
    }
  };

  async function loadUsers() {
    if (!usersTableBody) return;
    try {
      const users = await api.get("/users/");
      const approvedUsers = users.filter((u) => u.is_approved === 1);
      allTeachers = users.filter(
        (u) => u.role === "teacher" && u.is_approved === 1,
      );

      if (totalUsersCount) totalUsersCount.textContent = approvedUsers.length;
      if (totalTeachersCount)
        totalTeachersCount.textContent = allTeachers.length;

      populateTeachersDropdown();
      usersTableBody.innerHTML = "";

      if (approvedUsers.length === 0) {
        usersTableBody.innerHTML =
          '<tr><td colspan="5" style="text-align: center; color: var(--gray-color);">No active users found.</td></tr>';
        return;
      }

      approvedUsers.forEach((user) => {
        const safeName = escapeQuotes(user.name);
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="color: var(--gray-color);">#${user.id}</td>
            <td style="font-weight: 600;">${user.name}</td>
            <td style="color: var(--gray-color);">${user.email}</td>
            <td><span class="badge role">${user.role}</span></td>
            <td><button class="btn btn-sm btn-danger" onclick="window.deleteUser(${user.id}, '${safeName}')"><i class="fas fa-trash"></i> Delete</button></td>
        `;
        usersTableBody.appendChild(tr);
      });
    } catch (err) {
      console.error("Error loading users:", err);
    }
  }

  async function loadPendingUsers(isSilent = false) {
    try {
      const pendingUsers = await api.get("/users/pending");
      if (isSilent && pendingUsers.length === lastPendingCount) return;
      lastPendingCount = pendingUsers.length;

      if (overviewPendingCount)
        overviewPendingCount.textContent = pendingUsers.length;
      if (pendingTableBody) pendingTableBody.innerHTML = "";
      if (overviewPendingBody) overviewPendingBody.innerHTML = "";

      if (pendingUsers.length === 0) {
        if (pendingTableBody)
          pendingTableBody.innerHTML =
            '<tr><td colspan="6" style="text-align: center; color: var(--gray-color);">No pending requests.</td></tr>';
        if (overviewPendingBody)
          overviewPendingBody.innerHTML =
            '<tr><td colspan="4" style="text-align: center; color: var(--gray-color);">No pending requests at the moment.</td></tr>';
        return;
      }

      pendingUsers.forEach((user) => {
        const safeName = escapeQuotes(user.name);
        if (pendingTableBody) {
          const tr = document.createElement("tr");
          tr.innerHTML = `
              <td style="color: var(--gray-color);">#${user.id}</td>
              <td style="font-weight: 600;">${user.name}</td>
              <td style="color: var(--gray-color);">${user.email}</td>
              <td><span class="badge role">${user.role}</span></td>
              <td><span class="badge pending">Pending</span></td>
              <td class="flex-actions">
                  <button class="btn btn-sm btn-success" onclick="window.approveUser(${user.id}, '${safeName}')">Approve</button>
                  <button class="btn btn-sm btn-danger" onclick="window.deleteUser(${user.id}, '${safeName}')">Reject</button>
              </td>
          `;
          pendingTableBody.appendChild(tr);
        }
        if (overviewPendingBody) {
          const trMini = document.createElement("tr");
          trMini.innerHTML = `
              <td style="font-weight: 600;">${user.name}</td>
              <td style="color: var(--gray-color);">${user.email}</td>
              <td><span class="badge role">${user.role}</span></td>
              <td class="flex-actions">
                  <button class="btn btn-sm btn-success" onclick="window.approveUser(${user.id}, '${safeName}')" style="padding: 6px 12px;"><i class="fas fa-check"></i> Approve</button>
                  <button class="btn btn-sm btn-danger" onclick="window.deleteUser(${user.id}, '${safeName}')" style="padding: 6px 12px;"><i class="fas fa-times"></i> Reject</button>
              </td>
          `;
          overviewPendingBody.appendChild(trMini);
        }
      });
    } catch (err) {
      console.error("Error loading pending users:", err);
    }
  }

  setInterval(() => {
    loadPendingUsers(true);
  }, 5000);

  function populateTeachersDropdown() {
    if (!subjTeacherSelect) return;
    subjTeacherSelect.innerHTML = '<option value="">Select a Teacher</option>';
    allTeachers.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = `${t.name} (${t.email})`;
      subjTeacherSelect.appendChild(opt);
    });
  }

  async function loadSubjects() {
    if (!subjectsTableBody) return;
    try {
      const subjects = await api.get("/subjects/");
      if (totalSubjectsCount) totalSubjectsCount.textContent = subjects.length;
      subjectsTableBody.innerHTML = "";

      if (subjects.length === 0) {
        subjectsTableBody.innerHTML =
          '<tr><td colspan="5" style="text-align: center; color: var(--gray-color);">No subjects created yet.</td></tr>';
        return;
      }

      subjects.forEach((subj) => {
        const safeTitle = escapeQuotes(subj.title);
        const tr = document.createElement("tr");
        let optionsHtml = `<option value="0">Unassigned</option>`;
        allTeachers.forEach((t) => {
          optionsHtml += `<option value="${t.id}" ${subj.teacher_id === t.id ? "selected" : ""}>${t.name}</option>`;
        });
        tr.innerHTML = `
            <td style="font-weight: 700; color: var(--primary-color);">${subj.code || "-"}</td>
            <td style="font-weight: 600;">${subj.title}</td>
            <td style="color: var(--gray-color);">${subj.department || "N/A"}</td>
            <td><select class="admin-form-control" style="padding: 6px; font-size: 13px;" onchange="window.assignTeacherToSubject(${subj.id}, this.value)">${optionsHtml}</select></td>
            <td><button class="btn btn-sm btn-danger" onclick="window.deleteSubject(${subj.id}, '${safeTitle}')"><i class="fas fa-trash"></i> Delete</button></td>
        `;
        subjectsTableBody.appendChild(tr);
      });
    } catch (err) {
      console.error("Error loading subjects:", err);
    }
  }

  if (createSubjectForm) {
    createSubjectForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        title: document.getElementById("subj-name").value,
        code: document.getElementById("subj-code").value,
        department: document.getElementById("subj-dept").value || null,
        teacher_id: document.getElementById("subj-teacher").value
          ? parseInt(document.getElementById("subj-teacher").value)
          : null,
      };
      try {
        await api.post("/subjects/", payload);
        window.showCustomAlert(
          "Success",
          "Subject created successfully!",
          "fas fa-check-circle",
          "#10b981",
        );
        createSubjectForm.reset();
        loadSubjects();
      } catch (err) {
        window.showCustomAlert(
          "Error",
          err.message,
          "fas fa-exclamation-triangle",
          "#ef4444",
        );
      }
    });
  }

  // ==========================================
  // API ACTION FUNCTIONS (Global Windows Scope)
  // ==========================================
  window.assignTeacherToSubject = async function (subjectId, teacherId) {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("access_token");
      const response = await fetch(
        `http://localhost:8000/api/subjects/${subjectId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ teacher_id: parseInt(teacherId) }),
        },
      );
      if (!response.ok) throw new Error("Assignment failed on server.");

      window.showCustomAlert(
        "Assigned",
        "Teacher assignment updated!",
        "fas fa-user-check",
        "#10b981",
      );
      loadSubjects();
    } catch (err) {
      window.showCustomAlert(
        "Error",
        err.message,
        "fas fa-exclamation-triangle",
        "#ef4444",
      );
    }
  };

  window.deleteSubject = async function (id, name) {
    window.showCustomConfirm(
      "Delete Subject",
      `Are you sure you want to delete "${name}"?`,
      "fas fa-trash",
      "#ef4444",
      async () => {
        try {
          const token =
            localStorage.getItem("token") ||
            localStorage.getItem("access_token");
          const response = await fetch(
            `http://localhost:8000/api/subjects/${id}`,
            { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
          );
          if (!response.ok)
            throw new Error("Failed to delete subject from server.");

          window.showCustomAlert(
            "Deleted",
            "Subject removed successfully.",
            "fas fa-check-circle",
            "#ef4444",
          );
          loadSubjects();
        } catch (err) {
          window.showCustomAlert(
            "Error",
            err.message,
            "fas fa-exclamation-triangle",
            "#ef4444",
          );
        }
      },
    );
  };

  window.approveUser = async function (id, name) {
    window.showCustomConfirm(
      "Approve Account",
      `Approve the account for ${name}?`,
      "fas fa-user-check",
      "#10b981",
      async () => {
        try {
          const token =
            localStorage.getItem("token") ||
            localStorage.getItem("access_token");
          const response = await fetch(
            `http://localhost:8000/api/users/${id}/approve`,
            { method: "PUT", headers: { Authorization: `Bearer ${token}` } },
          );
          if (!response.ok) throw new Error("Failed to approve user.");

          window.showCustomAlert(
            "Approved",
            `${name} is now an active user.`,
            "fas fa-check-circle",
            "#10b981",
          );
          lastPendingCount = -1;
          loadPendingUsers();
          loadUsers();
        } catch (err) {
          window.showCustomAlert(
            "Error",
            err.message,
            "fas fa-exclamation-triangle",
            "#ef4444",
          );
        }
      },
    );
  };

  window.deleteUser = async function (id, name) {
    window.showCustomConfirm(
      "Reject / Delete",
      `Permanently remove the profile for ${name}?`,
      "fas fa-user-slash",
      "#ef4444",
      async () => {
        try {
          const token =
            localStorage.getItem("token") ||
            localStorage.getItem("access_token");
          const response = await fetch(
            `http://localhost:8000/api/users/${id}`,
            { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
          );
          if (!response.ok) throw new Error("Failed to remove user profile.");

          window.showCustomAlert(
            "Deleted",
            `User profile removed.`,
            "fas fa-check-circle",
            "#ef4444",
          );
          lastPendingCount = -1;
          loadUsers();
          loadPendingUsers();
        } catch (err) {
          window.showCustomAlert(
            "Error",
            err.message,
            "fas fa-exclamation-triangle",
            "#ef4444",
          );
        }
      },
    );
  };

  await loadUsers();
  await loadPendingUsers();
  await loadSubjects();
});
