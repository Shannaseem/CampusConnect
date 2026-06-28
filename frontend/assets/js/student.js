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
    profile: "Profile",
  };
  document.getElementById("panel-title").textContent =
    titles[tabName] || "Dashboard";

  // Close mobile menu if open
  const sidebar = document.getElementById("sidebar");
  const overlay = document.querySelector(".sidebar-overlay");
  if (window.innerWidth <= 768 && sidebar && overlay) {
    sidebar.classList.remove("mobile-open");
    overlay.classList.remove("show");
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  let studentReport = null;

  try {
    const user = await api.get("/users/me");
    const studentId = user.id;

    // Populate Profile Update Form
    document.getElementById("profile-name").value = user.name;
    if (user.department)
      document.getElementById("profile-department").value = user.department;

    // Fetch Comprehensive Report
    try {
      studentReport = await api.get(`/analytics/student/${studentId}/report`);

      // Render Overview stats
      const attSum = studentReport.attendance_summary;
      const totalClasses = attSum.total_classes;
      let attPercentage = 0;
      if (totalClasses > 0) {
        attPercentage = Math.round((attSum.present / totalClasses) * 100);
      }

      document.getElementById("stat-attendance").textContent =
        `${attPercentage}%`;
      document.getElementById("bar-attendance").style.width =
        `${attPercentage}%`;
      document.getElementById("stat-subjects").textContent =
        studentReport.subjects_enrolled;

      // We'll calculate assignments due from active assignments

      // Render Subject Analytics
      const subjectBody = document.getElementById("subject-analytics-body");
      subjectBody.innerHTML = "";
      if (studentReport.subject_details.length === 0) {
        subjectBody.innerHTML =
          '<tr><td colspan="4">No enrolled subjects.</td></tr>';
      } else {
        studentReport.subject_details.forEach((subj) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
                        <td><strong>${subj.subject_title}</strong></td>
                        <td>${subj.attendance_count}</td>
                        <td>${subj.assignments_count}</td>
                        <td>${subj.marks_obtained}</td>
                    `;
          subjectBody.appendChild(tr);
        });
      }
    } catch (err) {
      console.error("Failed to fetch report:", err);
      document.getElementById("subject-analytics-body").innerHTML =
        '<tr><td colspan="4" style="color:red;">Error loading analytics</td></tr>';
    }

    // Fetch Assignments and Filter Pending
    const assignmentsList = document.getElementById("assignments-list");
    if (assignmentsList) {
      try {
        // Fetch all assignments for enrolled subjects
        // We'll fetch all subjects, then assignments for each.
        // Alternatively, we can use the existing /assignments endpoint which gets all, but let's see.
        const assignments = await api.get("/assignments/"); // Gets all assignments across subjects (should ideally be filtered by enrollment, but assuming student sees relevant ones)

        // Show a popup if there's a new assignment created in the last 24h
        const now = new Date();
        const newAssignments = assignments.filter((a) => {
          // Assuming we have created_at, but if not we can just check deadline
          const due = new Date(a.due_date);
          return due > now; // Only future ones
        });

        document.getElementById("stat-assignments-due").textContent =
          newAssignments.length;

        // Trigger popup if there are assignments
        if (newAssignments.length > 0) {
          setTimeout(() => {
            document.getElementById("assignment-modal").classList.add("active");
          }, 1000);
        }

        assignmentsList.innerHTML = "";
        if (newAssignments.length === 0) {
          assignmentsList.innerHTML =
            '<p style="color: var(--text-muted); padding: 1rem;">No pending assignments.</p>';
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
                            <h4 style="color: white; margin-bottom: 0.5rem; font-size: 1.1rem;">${assign.title}</h4>
                            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">${assign.description}</p>
                            
                            ${assign.file_url ? `<a href="/api/assignments/download/${assign.file_url.split("/").pop()}" class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem; margin-bottom: 1rem;" target="_blank">📄 Attached File</a>` : ""}

                            <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: auto;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                    <span style="font-size: 0.8rem; color: var(--primary-color); font-weight: 600;">DUE: ${dateString}</span>
                                </div>
                                <form onsubmit="submitAssignment(event, ${assign.id})" style="display: flex; gap: 0.5rem; align-items: center;">
                                    <input type="file" id="submit-file-${assign.id}" class="form-control" style="padding: 0.5rem; font-size: 0.8rem;" required>
                                    <button type="submit" class="btn btn-primary" style="padding: 0.6rem 1rem;">Submit</button>
                                </form>
                            </div>
                        `;
            assignmentsList.appendChild(card);
          });
        }
      } catch (err) {
        console.error("Failed to fetch assignments:", err);
        assignmentsList.innerHTML =
          '<p style="color: #ef4444; padding: 1rem;">Error loading assignments.</p>';
      }
    }

    // Profile Form Setup
    document
      .getElementById("profile-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("profile-name").value;
        const dept = document.getElementById("profile-department").value;

        try {
          const updated = await api.put("/users/me", {
            name: name,
            department: dept,
          });
          alert("Profile updated successfully!");
          document.getElementById("user-name-display").textContent =
            updated.name;
        } catch (err) {
          alert("Failed to update profile: " + err.message);
        }
      });

    // PDF Download Logic
    document
      .getElementById("download-report-btn")
      .addEventListener("click", () => {
        if (!studentReport) {
          alert("Report data is not loaded yet.");
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
        });

        doc.save(`${studentReport.student_name.replace(" ", "_")}_Report.pdf`);
      });
  } catch (err) {
    console.error("Could not fetch user info in student.js", err);
  }
});

// Modal Close Function
window.closeModal = function () {
  document.getElementById("assignment-modal").classList.remove("active");
};

// Submit Assignment
window.submitAssignment = async function (e, assignmentId) {
  e.preventDefault();
  const fileInput = document.getElementById(`submit-file-${assignmentId}`);
  if (!fileInput.files[0]) {
    alert("Please select a file to submit.");
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    await api.post(`/assignments/${assignmentId}/submit`, formData, true);
    alert("Assignment submitted successfully!");
    // We could refresh the list, but for now a simple reload works
    window.location.reload();
  } catch (err) {
    alert("Submission failed: " + err.message);
  }
};
