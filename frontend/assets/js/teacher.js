// Tab Switching Engine
window.switchTeacherTab = function (tabName, element) {
  document
    .querySelectorAll(".tab-content")
    .forEach((tab) => tab.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((item) => item.classList.remove("active"));

  document.getElementById("tab-" + tabName).classList.add("active");
  if (element) element.classList.add("active");

  const titles = { operations: "Daily Operations", mysubjects: "My Subjects" };
  document.getElementById("panel-title").textContent =
    titles[tabName] || "Dashboard";

  const sidebar = document.getElementById("sidebar");
  const overlay = document.querySelector(".sidebar-overlay");
  if (window.innerWidth <= 768 && sidebar && overlay) {
    sidebar.classList.remove("mobile-open");
    overlay.classList.remove("show");
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("access_token");
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  let currentUser = null;

  // 1. Fetch Teacher Info & Populate Header
  try {
    const response = await fetch("http://localhost:8000/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Not authenticated");

    currentUser = await response.json();
    const nameDisp = document.getElementById("user-name-display");
    const avatarDisp = document.getElementById("user-avatar-initial");

    if (nameDisp) nameDisp.textContent = currentUser.name;
    if (avatarDisp)
      avatarDisp.textContent = currentUser.name.charAt(0).toUpperCase();
  } catch (e) {
    console.error("Auth Error:", e);
    localStorage.clear();
    window.location.href = "index.html";
    return;
  }

  // 2. Fetch Assigned Subjects
  try {
    const response = await fetch("http://localhost:8000/api/subjects/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const allSubjects = await response.json();

    // Filter subjects assigned to this specific teacher
    const teacherSubjects = allSubjects.filter(
      (s) => s.teacher_id === currentUser.id,
    );

    const subjectBody = document.getElementById("teacher-subjects-body");
    const assignSelect = document.getElementById("assign-subject");
    const attSelect = document.getElementById("att-subject");

    if (subjectBody) subjectBody.innerHTML = "";
    if (assignSelect)
      assignSelect.innerHTML = '<option value="">Select a Subject</option>';
    if (attSelect)
      attSelect.innerHTML = '<option value="">Select a Subject</option>';

    if (teacherSubjects.length === 0) {
      if (subjectBody)
        subjectBody.innerHTML =
          '<tr><td colspan="4" style="text-align:center; color: var(--gray-color);">No subjects assigned to you yet.</td></tr>';
    } else {
      teacherSubjects.forEach((subj) => {
        // Populate Table
        if (subjectBody) {
          const tr = document.createElement("tr");
          tr.innerHTML = `
                        <td style="font-weight: 700; color: var(--primary-color);">${subj.code || "N/A"}</td>
                        <td style="font-weight: 600;">${subj.title}</td>
                        <td style="color: var(--gray-color);">${subj.department || "General"}</td>
                        <td><span class="badge role" style="background: #eff6ff; color: var(--primary-color);">Active</span></td>
                    `;
          subjectBody.appendChild(tr);
        }
        // Populate Dropdowns
        const opt = `<option value="${subj.id}">${subj.title}</option>`;
        if (assignSelect) assignSelect.insertAdjacentHTML("beforeend", opt);
        if (attSelect) attSelect.insertAdjacentHTML("beforeend", opt);
      });
    }
  } catch (e) {
    console.error("Failed to load subjects:", e);
  }

  // 3. Post Assignment Logic
  const assignForm = document.getElementById("assignment-form");
  if (assignForm) {
    assignForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = assignForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Publishing...';
      submitBtn.disabled = true;

      const payload = {
        title: document.getElementById("assign-title").value,
        description: document.getElementById("assign-desc").value,
        due_date: new Date(
          document.getElementById("assign-deadline").value,
        ).toISOString(),
        subject_id: parseInt(document.getElementById("assign-subject").value),
      };

      try {
        const response = await fetch("http://localhost:8000/api/assignments/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.detail || "Failed to post assignment.");
        }

        if (typeof window.showCustomAlert === "function")
          window.showCustomAlert(
            "Success",
            "Assignment published to students successfully!",
            "fas fa-check-circle",
            "#10b981",
          );
        else alert("Assignment published successfully!");

        assignForm.reset();
      } catch (err) {
        if (typeof window.showCustomAlert === "function")
          window.showCustomAlert(
            "Error",
            err.message,
            "fas fa-times-circle",
            "#ef4444",
          );
        else alert(err.message);
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // 4. Mark Attendance Logic
  const attForm = document.getElementById("attendance-form");
  if (attForm) {
    attForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = attForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      submitBtn.disabled = true;

      const payload = {
        student_id: parseInt(document.getElementById("att-student-id").value),
        subject_id: parseInt(document.getElementById("att-subject").value),
        status: document.getElementById("att-status").value,
        date: new Date().toISOString().split("T")[0], // Today's date (YYYY-MM-DD)
      };

      try {
        const response = await fetch("http://localhost:8000/api/attendance/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.detail || "Failed to mark attendance.");
        }

        if (typeof window.showCustomAlert === "function")
          window.showCustomAlert(
            "Success",
            "Attendance logged successfully!",
            "fas fa-user-check",
            "#10b981",
          );
        else alert("Attendance logged successfully!");

        // Clear student ID to allow quick marking of next student
        document.getElementById("att-student-id").value = "";
      } catch (err) {
        if (typeof window.showCustomAlert === "function")
          window.showCustomAlert(
            "Error",
            err.message,
            "fas fa-exclamation-triangle",
            "#ef4444",
          );
        else alert(err.message);
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }
});
