// Проверка авторизации
async function checkAuthStatus() {
    const sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
        window.location.href = '/sso.html';
        return false;
    }
    
    try {
        const response = await fetch(`/api/check-session/${sessionId}`);
        const result = await response.json();
        if (result.success) {
            document.getElementById('logoutButton').style.display = 'inline-block';
            document.querySelector('.subtitleText').textContent = `треки для ${result.username}`;
            loadUserFiles(sessionId);
            return true;
        }
    } catch (e) {
        localStorage.removeItem('session_id');
    }
    window.location.href = '/sso.html';
    return false;
}

// Загрузка файлов пользователя
async function loadUserFiles(sessionId) {
    try {
        const response = await fetch(`/api/user-files/${sessionId}`);
        const result = await response.json();
        
        const filesGrid = document.getElementById('filesGrid');
        const fileCount = document.getElementById('fileCount');
        const noFiles = document.getElementById('noFiles');
        
        if (result.success && result.files.length > 0) {
            fileCount.textContent = result.files.length;
            noFiles.style.display = 'none';
            
            filesGrid.innerHTML = result.files.map(file => `
                <div class="fileCard">
                    <div class="fileInfo">
                        <i class="fas fa-music"></i>
                        <div>
                            <h4>${file.name}</h4>
                            <p>${new Date(file.created).toLocaleString('ru')}</p>
                            <span>${formatFileSize(file.size)}</span>
                        </div>
                    </div>
                    <div class="fileActions">
                        <a href="/files/${file.filename}" download class="btn-download">
                            <i class="fas fa-download"></i>
                        </a>
                        <button onclick="deleteFile('${file.filename}')" class="btn-delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            fileCount.textContent = '0';
            noFiles.style.display = 'block';
            filesGrid.innerHTML = '';
        }
    } catch (e) {
        console.error('Ошибка загрузки файлов');
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/(1024*1024)).toFixed(1) + ' MB';
}

async function deleteFile(filename) {
    if (!confirm('Удалить трек?')) return;
    
    const sessionId = localStorage.getItem('session_id');
    try {
        await fetch(`/api/delete-file/${sessionId}/${filename}`, { method: 'DELETE' });
        loadUserFiles(sessionId);
    } catch (e) {
        alert('Ошибка удаления');
    }
}

// Logout модалка (такая же как в app)
let logoutResolve;
function showLogoutModal() {
    document.getElementById('logoutModal').classList.add('active');
    return new Promise(resolve => {
        logoutResolve = resolve;
        document.getElementById('confirmLogout').onclick = async () => {
            document.getElementById('logoutModal').classList.remove('active');
            const sessionId = localStorage.getItem('session_id');
            if (sessionId) {
                await fetch(`/api/logout/${sessionId}`, { method: 'POST' });
            }
            localStorage.removeItem('session_id');
            window.location.href = '/sso.html';
        };
        document.getElementById('cancelLogout').onclick = () => {
            document.getElementById('logoutModal').classList.remove('active');
            resolve(false);
        };
    });
}

document.getElementById('logoutButton')?.addEventListener('click', showLogoutModal);
document.querySelector('.navigationButton').addEventListener('click', () => {
    window.location.href = '/app';  // ✅ /app
});

window.addEventListener('load', checkAuthStatus);
