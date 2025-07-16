// Function to show messages
function showMessage(message, type = 'success') {
    const messageContainer = document.getElementById('messageContainer');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.innerHTML = `
        ${message}
        <button class="close-btn" onclick="this.parentElement.remove()">&times;</button>
    `;
    messageContainer.appendChild(messageElement);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        messageElement.remove();
    }, 5000);
}

// Helper: get registered users from localStorage
function getRegisteredUsers() {
    return JSON.parse(localStorage.getItem('registeredUsers') || '[]');
}
// Helper: save registered users to localStorage
function saveRegisteredUsers(users) {
    localStorage.setItem('registeredUsers', JSON.stringify(users));
}

// On account page load: if logged in, redirect to dashboard; else, clear session and reset forms
window.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
        window.location.href = 'dashboard.html';
    } else {
        // Not logged in: clear all user data and reset forms
        localStorage.removeItem('userData');
        localStorage.removeItem('isLoggedIn');
        var LoginForm = document.getElementById('LoginForm');
        var RegForm = document.getElementById('RegForm');
        if (LoginForm) LoginForm.reset();
        if (RegForm) RegForm.reset();
    }
});

// Login form handling
document.getElementById('LoginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Example login handler
    fetch('http://localhost:8000/api/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }) // or { username, password }
    })
    .then(res => res.json())
    .then(data => {
      if (data.access) {
        localStorage.setItem('access', data.access); // THIS IS CRUCIAL
        localStorage.setItem('isLoggedIn', 'true');
        window.location.href = 'dashboard.html'; // or wherever
      } else {
        alert('Login failed!');
      }
    });
});

// Register form handling
document.getElementById('RegForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('regFullName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    
    // Check if email already exists
    const users = getRegisteredUsers();
    if (users.some(u => u.email === email)) {
        showMessage('This email is already registered. Please log in.', 'error');
        setTimeout(() => { login(); }, 1500);
        return;
    }
    users.push({
        name: fullName,
        email: email,
        password: password, // Never store plain passwords in real apps!
        profileImage: 'images/user-1.png',
        isPremium: false
    });
    saveRegisteredUsers(users);
    //showMessage('Registration successful! Please log in.', 'success');
    setTimeout(() => { login(); }, 1500);
});

// Logout function
function logout() {
    localStorage.removeItem('userData');
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html'; // Go to home page after logout
}

// Expose login() for form switching
function login() {
    var LoginForm = document.getElementById('LoginForm');
    var RegForm = document.getElementById('RegForm');
    var Indicator = document.getElementById('Indicator');
    RegForm.style.transform = "translateX(300px)";
    LoginForm.style.transform = "translateX(0px)";
    Indicator.style.transform = "translateX(0px)";
}

// Form switching logic
function register() {
    document.getElementById('RegForm').style.transform = "translateX(0px)";
    document.getElementById('LoginForm').style.transform = "translateX(-300px)";
    document.getElementById('Indicator').style.transform = "translateX(100px)";
}

// After successful login, set access token and redirect to dashboard
function handleLoginResponse(response) {
    localStorage.setItem('access', response.access); // or response.token, depending on your backend
    window.location.href = 'dashboard.html';
}