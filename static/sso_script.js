const loginFormContainer = document.querySelector('.login-form');
const registerFormContainer = document.querySelector('.register-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// ✅ ПРАВИЛЬНЫЕ ЭЛЕМЕНТЫ СООБЩЕНИЙ
const loginMessage = document.getElementById('login-unified-message');
const registerMessage = document.getElementById('register-unified-message');

showRegisterLink.addEventListener('click', () => {
    loginFormContainer.classList.remove('active');
    registerFormContainer.classList.add('active');
    clearMessage('login');
});

showLoginLink.addEventListener('click', () => {
    registerFormContainer.classList.remove('active');
    loginFormContainer.classList.add('active');
    clearMessage('register');
});

// ✅ ЕДИНАЯ ФУНКЦИЯ СООБЩЕНИЙ
function showMessage(type, text, formType) {
    const messageEl = formType === 'login' ? loginMessage : registerMessage;
    
    messageEl.className = `unified-message ${type}`;
    messageEl.textContent = text;
    messageEl.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 3000);
    }
}

function clearMessage(formType) {
    const messageEl = formType === 'login' ? loginMessage : registerMessage;
    if (messageEl) messageEl.style.display = 'none';
}

// ✅ РЕГИСТРАЦИЯ
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    if (!username || !email || !password || !confirmPassword) {
        showMessage('error', "Пожалуйста, заполните все поля", 'register');
        return;
    }

    if (password !== confirmPassword) {
        showMessage('error', "Пароли не совпадают", 'register');
        return;
    }

    if (password.length < 6) {
        showMessage('error', "Пароль должен содержать минимум 6 символов", 'register');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('error', "Введите корректный email адрес", 'register');
        return;
    }

    showMessage('process', 'Регистрация...', 'register');

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const result = await response.json();

        if (result.success) {
            showMessage('success', result.message, 'register');
            setTimeout(() => {
                registerFormContainer.classList.remove('active');
                loginFormContainer.classList.add('active');
                registerForm.reset();
                clearMessage('login');
            }, 1500);
        } else {
            showMessage('error', result.error || 'Ошибка регистрации!', 'register');
        }
    } catch (error) {
        showMessage('error', 'Ошибка сервера! Попробуйте позже', 'register');
    }
});

// ✅ ВХОД
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
        showMessage('error', "Пожалуйста, заполните все поля!", 'login');
        return;
    }

    showMessage('process', 'Проверка данных...', 'login');

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem('session_id', result.session_id);
            showMessage('success', `Добро пожаловать, ${result.username}!`, 'login');
            setTimeout(() => {
                window.location.href = '/app';
            }, 1500);
        } else {
            showMessage('error', result.error || 'Неверный логин/пароль', 'login');
        }
    } catch (error) {
        showMessage('error', 'Ошибка сервера! Попробуйте позже', 'login');
    }
});

// ✅ ПРОВЕРКА СЕССИИ
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

// ✅ АНИМАЦИЯ INPUT
const inputs = document.querySelectorAll('input');
inputs.forEach(input => {
    input.addEventListener('focus', function () {
        this.parentElement.querySelector('i').style.color = '#2e5b32';
    });
    input.addEventListener('blur', function () {
        this.parentElement.querySelector('i').style.color = '#2e5b32';
    });
});

// ✅ КНОПКА ГЛАВНАЯ
document.getElementById('homeButton').addEventListener('click', () => {
    window.location.href = '/';
});