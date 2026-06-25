const API_BASE_URL = 'http://localhost:8000/api';

const api = {
    async post(endpoint, data, isForm = false) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        let body;
        let headers = {};

        if (isForm) {
            body = new URLSearchParams(data);
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
        } else {
            body = JSON.stringify(data);
            headers['Content-Type'] = 'application/json';
        }

        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let errMsg = errorData.detail;
            if (typeof errMsg === 'object') {
                errMsg = JSON.stringify(errMsg);
            }
            throw new Error(errMsg || 'An error occurred');
        }

        return response.json();
    },

    async get(endpoint) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {};
        
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'An error occurred');
        }

        return response.json();
    },

    parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }
};
