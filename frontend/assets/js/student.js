window.switchStudentTab = function (tabName, element) {
  document
    .querySelectorAll(".tab-content")
    .forEach((tab) => tab.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((item) => item.classList.remove("active"));

  document.getElementById("tab-" + tabName).classList.add("active");
  if (element) element.classList.add("active");

  const titles = {
    overview: "My Progress",
    assignments: "Assignments",
    enrollment: "Course Registration",
    profile: "Profile",
  };
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
  let studentReport = null;
  let enrolledSubjectTitles = [];

  try {
    const user = await api.get("/users/me");
    const studentId = user.id;

    // Populate Profile
    const profileNameInput = document.getElementById("profile-name");
    const profileDeptInput = document.getElementById("profile-department");
    if (profileNameInput) profileNameInput.value = user.name || "";
    if (profileDeptInput) profileDeptInput.value = user.department || "";

    // 1. Fetch Report
    try {
      studentReport = await api.get(`/analytics/student/${studentId}/report`);

      if (studentReport.subject_details) {
        enrolledSubjectTitles = studentReport.subject_details.map(
          (s) => s.subject_title,
        );
      }

      const attSum = studentReport.attendance_summary;
      let attPercentage =
        attSum.total_classes > 0
          ? Math.round((attSum.present / attSum.total_classes) * 100)
          : 0;

      document.getElementById("stat-attendance").textContent =
        `${attPercentage}%`;
      const bar = document.getElementById("bar-attendance");
      if (bar) bar.style.width = `${attPercentage}%`;
      document.getElementById("stat-subjects").textContent =
        studentReport.subjects_enrolled;

      const subjectBody = document.getElementById("subject-analytics-body");
      if (subjectBody) {
        subjectBody.innerHTML = "";
        if (studentReport.subject_details.length === 0) {
          subjectBody.innerHTML =
            '<tr><td colspan="4" style="text-align: center; color: var(--gray-color);">No enrolled subjects found. Please enroll in a subject.</td></tr>';
        } else {
          studentReport.subject_details.forEach((subj) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td style="font-weight: 600;">${subj.subject_title}</td>
              <td>${subj.attendance_count}</td>
              <td>${subj.assignments_count}</td>
              <td><span class="badge role" style="background: #eff6ff; color: var(--primary-color); border-color: #bfdbfe;">${subj.marks_obtained}</span></td>
            `;
            subjectBody.appendChild(tr);
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch report:", err);
    }

    // 2. Fetch Available Subjects for Enrollment (Department Wise)
    const availableSubjectsList = document.getElementById(
      "available-subjects-list",
    );
    if (availableSubjectsList) {
      try {
        const allSubjects = await api.get("/subjects/");

        // LOGIC: Filter by Student's Department AND ensure they aren't already enrolled
        const availableSubjects = allSubjects.filter(
          (s) =>
            s.department === user.department &&
            !enrolledSubjectTitles.includes(s.title),
        );

        availableSubjectsList.innerHTML = "";
        if (availableSubjects.length === 0) {
          availableSubjectsList.innerHTML = `<p style="color: var(--text-muted); grid-column: 1 / -1;">No new subjects offered for <b>${user.department || "your department"}</b> at the moment.</p>`;
        } else {
          availableSubjects.forEach((subj) => {
            const card = document.createElement("div");
            card.className = "stat-card";
            card.innerHTML = `
                        <h4 style="color: var(--dark-color); margin-bottom: 0.5rem; font-family: 'Outfit', sans-serif;">${subj.title}</h4>
                        <p style="color: var(--gray-color); font-size: 0.85rem; margin-bottom: 1rem;">Code: <strong style="color: var(--primary-color);">${subj.code || "N/A"}</strong> | Dept: ${subj.department}</p>
                        <button class="btn btn-outline" onclick="enrollInSubject(${subj.id}, this)" style="width: 100%; justify-content: center;"><i class="fas fa-plus"></i> Enroll Now</button>
                    `;
            availableSubjectsList.appendChild(card);
          });
        }
      } catch (err) {
        console.error("Failed to fetch subjects for enrollment:", err);
        availableSubjectsList.innerHTML =
          '<p style="color: #ef4444; grid-column: 1 / -1;">Failed to load available subjects.</p>';
      }
    }

    // 3. Fetch Assignments
    const assignmentsList = document.getElementById("assignments-list");
    if (assignmentsList) {
      try {
        const assignments = await api.get("/assignments/");
        const now = new Date();
        const newAssignments = assignments.filter((a) => {
          const due = new Date(a.due_date);
          return due > now;
        });

        document.getElementById("stat-assignments-due").textContent =
          newAssignments.length;

        if (
          newAssignments.length > 0 &&
          typeof window.showCustomAlert === "function"
        ) {
          setTimeout(() => {
            window.showCustomAlert(
              "Action Required",
              `You have ${newAssignments.length} pending assignments to submit!`,
              "fas fa-bell",
              "#f59e0b",
            );
          }, 1000);
        }

        assignmentsList.innerHTML = "";
        if (newAssignments.length === 0) {
          assignmentsList.innerHTML =
            '<p style="color: var(--text-muted); padding: 1rem; grid-column: 1 / -1;">No pending assignments.</p>';
        } else {
          newAssignments.forEach((assign) => {
            const card = document.createElement("div");
            card.className = "stat-card";
            const d = new Date(assign.due_date);
            const dateString =
              d.toLocaleDateString() +
              " " +
              d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            card.innerHTML = `
              <h4 style="color: var(--dark-color); margin-bottom: 0.5rem; font-size: 1.1rem; font-family: 'Outfit', sans-serif;">${assign.title}</h4>
              <p style="color: var(--gray-color); font-size: 0.9rem; margin-bottom: 1rem; flex: 1;">${assign.description}</p>
              ${assign.file_url ? `<a href="/api/assignments/download/${assign.file_url.split("/").pop()}" class="btn btn-outline" style="font-size: 0.8rem; padding: 0.4rem 0.8rem; margin-bottom: 1rem; display: inline-flex; align-items: center; gap: 5px; width: fit-content;" target="_blank"><i class="fas fa-file-alt"></i> Attached File</a>` : ""}
              <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                  <span style="font-size: 0.8rem; color: #ef4444; font-weight: 600;"><i class="far fa-clock"></i> DUE: ${dateString}</span>
                </div>
                <form onsubmit="submitAssignment(event, ${assign.id})" style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                  <input type="file" id="submit-file-${assign.id}" class="admin-form-control" style="padding: 0.5rem; font-size: 0.8rem; flex: 1; min-width: 150px;" required>
                  <button type="submit" class="btn btn-primary" style="padding: 0.5rem 1rem; white-space: nowrap;">Submit</button>
                </form>
              </div>
            `;
            assignmentsList.appendChild(card);
          });
        }
      } catch (err) {
        console.error("Failed to fetch assignments:", err);
      }
    }

    // 4. PROFILE FORM SUBMISSION (Native Fetch)
    const profileForm = document.getElementById("profile-form");
    if (profileForm) {
      profileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nameValue = document.getElementById("profile-name").value;
        const deptValue = document.getElementById("profile-department").value;

        try {
          const token =
            localStorage.getItem("token") ||
            localStorage.getItem("access_token");
          const response = await fetch("http://localhost:8000/api/users/me", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: nameValue,
              department: deptValue || null,
            }),
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Server rejected the update.");
          }

          const updated = await response.json();
          if (typeof window.showCustomAlert === "function") {
            window.showCustomAlert(
              "Success",
              "Profile details updated successfully!",
              "fas fa-check-circle",
              "#10b981",
            );
          } else {
            alert("Profile updated successfully!");
          }

          const nameDisp = document.getElementById("user-name-display");
          if (nameDisp) nameDisp.textContent = updated.name;
        } catch (err) {
          if (typeof window.showCustomAlert === "function") {
            window.showCustomAlert(
              "Error",
              "Failed to update profile: " + err.message,
              "fas fa-exclamation-triangle",
              "#ef4444",
            );
          } else {
            alert("Failed to update profile: " + err.message);
          }
        }
      });
    }

    // 5. PDF Download Event
    const downloadBtn = document.getElementById("download-report-btn");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", () => {
        if (!studentReport) {
          if (typeof window.showCustomAlert === "function")
            window.showCustomAlert(
              "Wait!",
              "Report data is still loading.",
              "fas fa-hourglass-half",
              "#f59e0b",
            );
          else alert("Report data is not loaded yet.");
          return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text("CampusConnect - Student Report", 14, 20);
        doc.setFontSize(12);
        doc.text(`Student Name: ${studentReport.student_name}`, 14, 30);
        doc.text(`Email: ${studentReport.email}`, 14, 36);
        doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 42);
        doc.setFontSize(16);
        doc.text("Attendance Summary", 14, 55);
        doc.autoTable({
          startY: 60,
          head: [["Present", "Absent", "Late", "Total Classes"]],
          body: [
            [
              studentReport.attendance_summary.present,
              studentReport.attendance_summary.absent,
              studentReport.attendance_summary.late,
              studentReport.attendance_summary.total_classes,
            ],
          ],
          theme: "grid",
          headStyles: { fillColor: [59, 130, 246] },
        });
        const finalY = doc.lastAutoTable.finalY || 60;
        doc.text("Subject Breakdown", 14, finalY + 15);
        const subjectData = studentReport.subject_details.map((s) => [
          s.subject_title,
          s.attendance_count,
          s.assignments_count,
          s.marks_obtained,
        ]);
        doc.autoTable({
          startY: finalY + 20,
          head: [["Subject", "Attendance Count", "Assignments", "Total Marks"]],
          body: subjectData,
          theme: "grid",
          headStyles: { fillColor: [59, 130, 246] },
        });
        doc.save(`${studentReport.student_name.replace(" ", "_")}_Report.pdf`);
      });
    }
  } catch (err) {
    console.error("Could not fetch user info in student.js", err);
  }
});

// Submit Assignment
window.submitAssignment = async function (e, assignmentId) {
  e.preventDefault();
  const form = e.target;
  const fileInput = document.getElementById(`submit-file-${assignmentId}`);

  if (!fileInput.files[0]) {
    if (typeof window.showCustomAlert === "function")
      window.showCustomAlert(
        "Action Required",
        "Please attach a file before submitting.",
        "fas fa-paperclip",
        "#f59e0b",
      );
    else alert("Please select a file to submit.");
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
  submitBtn.disabled = true;

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const token =
      localStorage.getItem("token") || localStorage.getItem("access_token");
    const response = await fetch(
      `http://localhost:8000/api/assignments/${assignmentId}/submit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      },
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Upload failed");
    }

    if (typeof window.showCustomAlert === "function") {
      window.showCustomAlert(
        "Success",
        "Your assignment has been submitted to the teacher.",
        "fas fa-check-circle",
        "#10b981",
      );
    } else {
      alert("Assignment submitted successfully!");
    }

    submitBtn.innerHTML = '<i class="fas fa-check"></i> Submitted';
    submitBtn.classList.remove("btn-primary");
    submitBtn.disabled = true;
    submitBtn.style.background = "#10b981";
    submitBtn.style.borderColor = "#10b981";
    submitBtn.style.color = "white";
    fileInput.disabled = true;
  } catch (err) {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    if (typeof window.showCustomAlert === "function") {
      window.showCustomAlert(
        "Error",
        "Submission failed: " + err.message,
        "fas fa-times-circle",
        "#ef4444",
      );
    } else {
      alert("Submission failed: " + err.message);
    }
  }
};

// Enroll In Subject
window.enrollInSubject = async function (subjectId, btnElement) {
  const originalText = btnElement.innerHTML;
  btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enrolling...';
  btnElement.disabled = true;

  try {
    const token =
      localStorage.getItem("token") || localStorage.getItem("access_token");
    const response = await fetch(
      `http://localhost:8000/api/subjects/${subjectId}/enroll`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to enroll in subject.");
    }

    if (typeof window.showCustomAlert === "function") {
      window.showCustomAlert(
        "Enrolled Successfully",
        "You have been registered for this subject. It will now appear in your progress tab.",
        "fas fa-check-circle",
        "#10b981",
      );
    } else {
      alert("Enrolled successfully!");
    }

    btnElement.parentElement.style.display = "none";
  } catch (err) {
    btnElement.innerHTML = originalText;
    btnElement.disabled = false;
    if (typeof window.showCustomAlert === "function") {
      window.showCustomAlert(
        "Enrollment Error",
        err.message,
        "fas fa-exclamation-triangle",
        "#ef4444",
      );
    } else {
      alert(err.message);
    }
  }
};
