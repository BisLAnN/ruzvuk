const loginFormContainer = document.querySelector('.login-form');
const registerFormContainer = document.querySelector('.register-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

const loginError = document.getElementById('login-error');
const loginSuccess = document.getElementById('login-success');
const registerError = document.getElementById('register-error');
const registerSuccess = document.getElementById('register-success');

showRegisterLink.addEventListener('click', () => {
    loginFormContainer.classList.remove('active');
    registerFormContainer.classList.add('active');
    clearMessages();
});

showLoginLink.addEventListener('click', () => {
    registerFormContainer.classList.remove('active');
    loginFormContainer.classList.add('active');
    clearMessages();
});

function clearMessages() {
    [loginError, loginSuccess, registerError, registerSuccess].forEach(el => {
        el.style.display = 'none';
    });
}

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    if (!username || !email || !password || !confirmPassword) {
        showMessage(registerError, "Пожалуйста, заполните все поля");
        return;
    }

    if (password !== confirmPassword) {
        showMessage(registerError, "Пароли не совпадают");
        return;
    }

    if (password.length < 6) {
        showMessage(registerError, "Пароль должен содержать минимум 6 символов");
        return;
    }

    if (!isValidEmail(email)) {
        showMessage(registerError, "Введите корректный email адрес");
        return;
    }

    showMessage(registerError, 'Регистрация...');

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const result = await response.json();

        if (result.success) {
            showMessage(registerSuccess, result.message);
            setTimeout(() => {
                registerFormContainer.classList.remove('active');
                loginFormContainer.classList.add('active');
                registerForm.reset();
            }, 1500);
        } else {
            showMessage(registerError, result.error || 'Ошибка регистрации');
        }
    } catch (error) {
        showMessage(registerError, 'Ошибка сервера. Попробуйте позже.');
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
        showMessage(loginError, "Пожалуйста, заполните все поля");
        return;
    }

    showMessage(loginError, 'Проверка данных...');

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem('session_id', result.session_id);
            showMessage(loginSuccess, `Добро пожаловать, ${result.username}!`);

            setTimeout(() => {
                window.location.href = '/app';
            }, 1500);
        } else {
            showMessage(loginError, result.error || 'Неверный логин/пароль');
        }
    } catch (error) {
        showMessage(loginError, 'Ошибка сервера. Попробуйте позже.');
    }
});

window.addEventListener('load', async () => {
    const sessionId = localStorage.getItem('session_id');
    if (sessionId) {
        try {
            const response = await fetch(`/api/check-session/${sessionId}`);
            const result = await response.json();
            if (result.success) {

                window.location.href = '/app';
            }
        } catch (e) {
            localStorage.removeItem('session_id');
        }
    }
});

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showMessage(element, text) {
    element.textContent = text;
    element.style.display = 'block';

    if (element.classList.contains('error-message')) {
        if (element === loginError) loginSuccess.style.display = 'none';
        if (element === registerError) registerSuccess.style.display = 'none';
    } else {
        if (element === loginSuccess) loginError.style.display = 'none';
        if (element === registerError) registerSuccess.style.display = 'none';
    }

    if (element.classList.contains('success-message')) {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

const inputs = document.querySelectorAll('input');
inputs.forEach(input => {
    input.addEventListener('focus', function () {
        this.parentElement.querySelector('i').style.color = '#2e5b32';
    });

    input.addEventListener('blur', function () {
        this.parentElement.querySelector('i').style.color = '#2e5b32';
    });
});