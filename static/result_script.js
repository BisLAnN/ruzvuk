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
        console.error('Сессия истекла');
        localStorage.removeItem('session_id');
    }
    window.location.href = '/sso.html';
    return false;
}

async function loadUserFiles(sessionId) {
    try {
        console.log('Загружаем файлы для сессии:', sessionId);
        const response = await fetch(`/api/user-files/${sessionId}`);
        const result = await response.json();
        console.log('Ответ API:', result);
        
        const filesGrid = document.getElementById('filesGrid');
        const fileCount = document.getElementById('fileCount');
        const noFiles = document.getElementById('noFiles');
        
        if (result.success && result.files && result.files.length > 0) {
            fileCount.textContent = result.files.length;
            noFiles.style.display = 'none';
            
            filesGrid.innerHTML = result.files.map(file => `
                <div class="fileCard">
                    <div class="fileInfo">
                        <i class="fas fa-music"></i>
                        <div>
                            <h4>${file.name || 'Новый трек'}</h4>
                            <p>${new Date(file.created * 1000).toLocaleString('ru-RU')}</p>
                            <span>${formatFileSize(file.size)}</span>
                        </div>
                    </div>
                    <div class="fileActions">
                        <a href="/files/${file.filename}" download class="btn-download">
                            <i class="fas fa-download"></i> Скачать
                        </a>
                        <button onclick="deleteFile('${file.filename}')" class="btn-delete" title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            console.log('Файлов нет или ошибка:', result);
            fileCount.textContent = '0';
            noFiles.style.display = 'block';
            filesGrid.innerHTML = '';
        }
    } catch (e) {
        console.error('Ошибка загрузки файлов:', e);
        document.getElementById('noFiles').textContent = 'Ошибка загрузки треков';
    }
}

function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/(1024*1024)).toFixed(1) + ' MB';
}

async function deleteFile(filename) {
    if (!confirm('Удалить трек навсегда?')) return;
    
    const sessionId = localStorage.getItem('session_id');
    try {
        const response = await fetch(`/api/delete-file/${sessionId}/${filename}`, { 
            method: 'DELETE' 
        });
        if (response.ok) {
            loadUserFiles(sessionId);
        } else {
            alert('Ошибка удаления');
        }
    } catch (e) {
        alert('Ошибка удаления');
    }
}

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

// Навигация
document.querySelector('.navigationButton')?.addEventListener('click', () => {
    window.location.href = '/app';
});

document.getElementById('logoutButton')?.addEventListener('click', showLogoutModal);

window.addEventListener('load', checkAuthStatus);
