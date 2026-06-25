document.addEventListener('DOMContentLoaded', async () => {
    // 1. Authentication Check
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'auth.html';
        return; // Stop execution
    }

    // 2. Logout Logic
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user_role');
            window.location.href = 'auth.html';
        });
    }

    // 3. Fetch User Details & Populate Dashboard Header
    try {
        const user = await api.get('/users/me');
        
        // Store user ID globally for other scripts to use if needed
        window.currentUser = user;

        // Role-based page protection
        const currentPage = window.location.pathname.split('/').pop();
        let userRole = user.role;
        if (typeof userRole === 'object' && userRole.value) {
            userRole = userRole.value;
        }
        userRole = String(userRole).toLowerCase();

        if (currentPage === 'teacher.html' && userRole !== 'teacher' && userRole !== 'admin') {
            window.location.href = 'student.html';
            return;
        } else if (currentPage === 'admin.html' && userRole !== 'admin') {
            window.location.href = 'student.html';
            return;
        }

        const nameDisplay = document.getElementById('user-name-display');
        if (nameDisplay) {
            nameDisplay.textContent = user.name;
        }
        
        // Also update Role display dynamically
        const roleDisplay = document.querySelector('.user-role');
        if (roleDisplay) {
            roleDisplay.textContent = userRole.charAt(0).toUpperCase() + userRole.slice(1);
        }

    } catch (err) {
        console.error("Failed to fetch user profile", err);
        // If token is expired or invalid, force logout
        if (err.message.includes('Could not validate credentials') || err.message.includes('Not authenticated')) {
            localStorage.removeItem('token');
            window.location.href = 'auth.html';
        }
    }
});
