const API_URL = 'http://localhost:8080';
let token = localStorage.getItem('token');

function showMessage(text, isError = false) {
    const messageEl = document.getElementById('message');
    if (messageEl) {
        messageEl.textContent = text;
        messageEl.style.color = isError ? '#d00' : '#0d0';
    }
}

async function makeRequest(url, options) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Request failed:', error);
        showMessage(`Request failed: ${error.message}`, true);
        throw error;
    }
}

async function register(event) {
    event.preventDefault();
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;

    try {
        await makeRequest(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        showMessage('Registration successful. Please log in.');
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    } catch (error) {
        // Error is already handled in makeRequest
    }
}

async function login(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const data = await makeRequest(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        token = data.token;
        localStorage.setItem('token', token);
        showMessage('Login successful.');
        showLoggedInState();
    } catch (error) {
        // Error is already handled in makeRequest
    }
}

async function fetchVideos() {
    try {
        const data = await makeRequest(`${API_URL}/videos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const videoList = document.getElementById('videoList');
        if (videoList) {
            videoList.innerHTML = '';
            data.videos.forEach(video => {
                const li = document.createElement('li');
                li.textContent = video;
                li.onclick = () => playVideo(video);
                videoList.appendChild(li);
            });
        }
    } catch (error) {
        showMessage('Failed to fetch videos. Please log in again.', true);
        logout();
    }
}

async function playVideo(filename) {
    const videoPlayer = document.getElementById('videoPlayer');
    if (videoPlayer) {
        try {
            const response = await fetch(`${API_URL}/video/${filename}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const blob = await response.blob();
            const videoUrl = URL.createObjectURL(blob);
            videoPlayer.src = videoUrl;
            videoPlayer.classList.remove('hidden');
        } catch (error) {
            console.error('Error playing video:', error);
            showMessage(`Error playing video: ${error.message}`, true);
        }
    }
}

function logout() {
    localStorage.removeItem('token');
    token = null;
    showLoggedOutState();
    showMessage('Logged out successfully.');
}

function showLoggedInState() {
    const loginForm = document.getElementById('loginForm');
    const videoSection = document.getElementById('videoSection');
    if (loginForm) loginForm.classList.add('hidden');
    if (videoSection) videoSection.classList.remove('hidden');
    fetchVideos();
}

function showLoggedOutState() {
    const loginForm = document.getElementById('loginForm');
    const videoSection = document.getElementById('videoSection');
    const videoPlayer = document.getElementById('videoPlayer');
    if (loginForm) loginForm.classList.remove('hidden');
    if (videoSection) videoSection.classList.add('hidden');
    if (videoPlayer) videoPlayer.classList.add('hidden');
}

// Determine which page we're on and attach the appropriate event listeners
if (document.getElementById('registerFormElement')) {
    document.getElementById('registerFormElement').addEventListener('submit', register);
} else if (document.getElementById('loginFormElement')) {
    document.getElementById('loginFormElement').addEventListener('submit', login);
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
    
    // Check if user is already logged in
    if (token) {
        showLoggedInState();
    } else {
        showLoggedOutState();
    }
}