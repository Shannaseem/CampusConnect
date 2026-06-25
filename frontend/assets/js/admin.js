document.addEventListener('DOMContentLoaded', async () => {
    const usersTableBody = document.getElementById('users-table-body');
    const totalUsersCount = document.getElementById('total-users-count');

    async function loadUsers() {
        if (!usersTableBody) return;
        
        try {
            const users = await api.get('/users/');
            
            if (totalUsersCount) {
                totalUsersCount.textContent = users.length;
            }

            usersTableBody.innerHTML = ''; // Clear loading

            if (users.length === 0) {
                usersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No users found.</td></tr>';
                return;
            }

            users.forEach(user => {
                const tr = document.createElement('tr');
                
                // Color code the role
                let roleColor = 'var(--text-main)';
                if (user.role === 'admin') roleColor = 'var(--primary-color)';
                else if (user.role === 'teacher') roleColor = '#10b981'; // Greenish

                tr.innerHTML = `
                    <td>#${user.id}</td>
                    <td style="font-weight: 600;">${user.name}</td>
                    <td style="color: var(--text-muted);">${user.email}</td>
                    <td style="color: ${roleColor}; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px;">${user.role}</td>
                    <td>${user.department || '-'}</td>
                    <td>
                        <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: #ef4444; border-color: rgba(239,68,68,0.3);" onclick="deleteUser(${user.id}, '${user.name}')">Delete</button>
                    </td>
                `;
                usersTableBody.appendChild(tr);
            });
        } catch (err) {
            console.error("Failed to load users:", err);
            usersTableBody.innerHTML = '<tr><td colspan="6" style="color: #ef4444; text-align: center;">Error loading users.</td></tr>';
        }
    }

    // Initial Load
    loadUsers();

    // Make deleteUser globally accessible
    window.deleteUser = async function(userId, userName) {
        if (!confirm(`Are you sure you want to permanently delete the profile for ${userName}?`)) {
            return;
        }

        try {
            await api.post(`/users/${userId}`, {}, false); 
            // Wait, our backend uses DELETE method for /api/users/{user_id}. 
            // Let's implement a direct fetch for DELETE since api.js only has get and post.
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Deletion failed');
            }

            alert(`User ${userName} deleted successfully.`);
            loadUsers(); // Refresh table
        } catch (err) {
            alert("Error deleting user: " + err.message);
        }
    };
});
