document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const errorContainer = document.getElementById('error-container');

    function showError(message, isSuccess = false) {
        if (!errorContainer) return;
        errorContainer.style.display = 'block';
        errorContainer.textContent = message;
        
        if (isSuccess) {
            errorContainer.style.background = 'rgba(16, 185, 129, 0.1)';
            errorContainer.style.color = '#10b981';
            errorContainer.style.borderColor = 'rgba(16, 185, 129, 0.2)';
        } else {
            errorContainer.style.background = 'rgba(239, 68, 68, 0.1)';
            errorContainer.style.color = '#ef4444';
            errorContainer.style.borderColor = 'rgba(239, 68, 68, 0.2)';
        }
    }

    function hideError() {
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
    }

    // Login Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const btn = loginForm.querySelector('button');
            const originalText = btn.textContent;

            try {
                btn.textContent = 'Authenticating...';
                btn.disabled = true;
                
                // FastAPI OAuth2 requires form data
                const res = await api.post('/auth/login', {
                    username: email,
                    password: password
                }, true);

                localStorage.setItem('token', res.access_token);
                
                // Decode JWT to get role
                const payload = api.parseJwt(res.access_token);
                if (!payload) throw new Error("Invalid token received from server");
                
                const role = payload.role;
                localStorage.setItem('user_role', role);

                showError('Authentication successful. Redirecting...', true);

                // Redirect based on role
                setTimeout(() => {
                    if (role === 'admin') window.location.href = 'admin.html';
                    else if (role === 'teacher') window.location.href = 'teacher.html';
                    else window.location.href = 'student.html';
                }, 500);

            } catch (err) {
                showError(err.message || 'Authentication failed. Please verify your credentials.');
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }

    // Register Submission
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError();
            
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const role = document.getElementById('reg-role').value;
            
            const btn = registerForm.querySelector('button');
            const originalText = btn.textContent;

            try {
                btn.textContent = 'Initializing...';
                btn.disabled = true;

                await api.post('/auth/register', {
                    name, email, password, role
                });

                showError('Profile initialized successfully! You may now log in.', true);
                registerForm.reset();
                
                setTimeout(() => {
                    if (typeof switchTab === 'function') {
                        switchTab('login');
                    }
                    btn.textContent = originalText;
                    btn.disabled = false;
                }, 2000);

            } catch (err) {
                showError(err.message || 'Initialization failed. Please check the data provided.');
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }
});
