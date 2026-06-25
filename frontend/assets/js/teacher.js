document.addEventListener('DOMContentLoaded', async () => {
    let teacherId = null;

    try {
        const user = await api.get('/users/me');
        teacherId = user.id;

        // Profile Initialization
        document.getElementById('profile-name').value = user.name;
        if (user.department) document.getElementById('profile-department').value = user.department;

        // Fetch and Render Subjects
        await loadSubjects(teacherId);

        // Fetch Students for Attendance
        try {
            // For now, load all students. In a real app, this would be filtered by the selected subject
            const students = await api.get('/users/students');
            const studentSelect = document.getElementById('student-select');
            studentSelect.innerHTML = '<option value="">Select a student...</option>';
            students.forEach(s => {
                studentSelect.innerHTML += `<option value="${s.id}">${s.name} (${s.email})</option>`;
            });
        } catch (e) {
            console.error("Failed to load students", e);
        }

    } catch (err) {
        console.error("Could not fetch user info in teacher.js", err);
    }

    // Profile Form Submit
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('profile-name').value;
        const dept = document.getElementById('profile-department').value;
        try {
            const updated = await api.put('/users/me', { name: name, department: dept });
            alert("Profile updated successfully!");
            document.getElementById('user-name-display').textContent = updated.name;
        } catch (err) {
            alert("Failed to update profile: " + err.message);
        }
    });

    // Create Subject
    document.getElementById('create-subject-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('subj-title').value;
        const desc = document.getElementById('subj-desc').value;
        try {
            await api.post('/subjects/', { title, description: desc });
            alert('Subject created!');
            document.getElementById('create-subject-form').reset();
            await loadSubjects(teacherId); // reload list
        } catch (err) {
            alert('Error creating subject: ' + err.message);
        }
    });

    // Post Assignment
    document.getElementById('assignment-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const subjectId = document.getElementById('assign-subject').value;
        const title = document.getElementById('assign-title').value;
        const desc = document.getElementById('assign-desc').value;
        const deadline = document.getElementById('assign-deadline').value;
        const fileInput = document.getElementById('assign-file');

        if (!subjectId) {
            alert("Please select a subject first.");
            return;
        }

        // We convert datetime-local to ISO string
        let isoDeadline;
        try {
            isoDeadline = new Date(deadline).toISOString();
        } catch (e) {
            alert("Invalid date format");
            return;
        }

        try {
            // First create the assignment (without file)
            const created = await api.post('/assignments/', {
                title: title,
                description: desc,
                subject_id: parseInt(subjectId),
                due_date: isoDeadline
            });

            // If a file is attached, upload it
            if (fileInput.files.length > 0) {
                const formData = new FormData();
                formData.append('file', fileInput.files[0]);
                await api.post(`/assignments/${created.id}/upload`, formData, true);
            }

            alert("Assignment posted successfully!");
            document.getElementById('assignment-form').reset();
        } catch (err) {
            alert("Failed to post assignment: " + err.message);
        }
    });

    // Mark Attendance
    document.getElementById('attendance-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const subjectId = document.getElementById('att-subject').value;
        const studentId = document.getElementById('student-select').value;
        const status = document.getElementById('attendance-status').value;

        if (!subjectId || !studentId) {
            alert("Please select both subject and student.");
            return;
        }

        // Current date in YYYY-MM-DD
        const dateStr = new Date().toISOString().split('T')[0];

        try {
            await api.post('/attendance/', {
                student_id: parseInt(studentId),
                subject_id: parseInt(subjectId),
                date: dateStr,
                status: status
            });
            alert('Attendance marked successfully!');
            // Reset just the student and status
            document.getElementById('student-select').value = "";
            document.getElementById('attendance-status').value = "present";
        } catch (err) {
            alert('Error marking attendance: ' + err.message);
        }
    });
});

async function loadSubjects(teacherId) {
    try {
        const subjects = await api.get('/subjects/');
        const container = document.getElementById('subjects-container');
        const assignDropdown = document.getElementById('assign-subject');
        const attDropdown = document.getElementById('att-subject');

        container.innerHTML = '';
        assignDropdown.innerHTML = '<option value="">Select a subject...</option>';
        attDropdown.innerHTML = '<option value="">Select a subject...</option>';

        if (subjects.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); padding: 1rem;">No subjects created yet.</p>';
            return;
        }

        subjects.forEach(s => {
            // Dropdowns
            const opt = `<option value="${s.id}">${s.title}</option>`;
            assignDropdown.innerHTML += opt;
            attDropdown.innerHTML += opt;

            // Cards
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `
                <h4 style="color: white; font-size: 1.2rem; margin-bottom: 0.5rem;">${s.title}</h4>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">${s.description}</p>
                <div style="margin-top: auto; border-top: 1px solid var(--border-color); padding-top: 1rem;">
                    <span style="font-size: 0.8rem; color: var(--primary-color);">ID: ${s.id}</span>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (e) {
        console.error("Failed to load subjects", e);
    }
}
