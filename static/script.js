function initializeSingleSelect(chipGroupId) {
    const chipGroup = document.getElementById(chipGroupId);
    chipGroup.addEventListener("click", (event) => {
        if (!event.target.classList.contains("chipButton")) return;
        chipGroup.querySelectorAll(".chipButton").forEach(button =>
            button.classList.remove("chipButtonActive")
        );
        event.target.classList.add("chipButtonActive");
    });
}

initializeSingleSelect("genreChipGroup");
initializeSingleSelect("moodChipGroup");
initializeSingleSelect("instrumentChipGroup");

document.querySelectorAll(".presetCard").forEach(card => {
    card.addEventListener("click", () => {
        document.querySelectorAll(".presetCard")
            .forEach(c => c.classList.remove("presetCardActive"));
        card.classList.add("presetCardActive");

        const genre = card.dataset.genre;
        const mood = card.dataset.mood;

        document.querySelector(`#genreChipGroup button[genre="${genre}"]`)?.click();
        document.querySelector(`#moodChipGroup button[mood="${mood}"]`)?.click();
    });
});

const lengthSlider = document.getElementById("lengthSlider");
const lengthLabel = document.getElementById("lengthLabel");

lengthSlider.addEventListener("input", () => {
    const value = parseInt(lengthSlider.value);

    let minutesText;
    if (value === 1) {
        minutesText = "минута";
    } else if (value === 5) {
        minutesText = "минут";
    } else if (value >= 2 && value <= 4) {
        minutesText = "минуты";
    } else {
        minutesText = "минут";
    }

    lengthLabel.textContent = `${value} ${minutesText}`;
});

const tempoSlider = document.getElementById("tempoSlider");
const tempoLabel = document.getElementById("tempoLabel");
tempoSlider.addEventListener("input", () => {
    tempoLabel.textContent = `${tempoSlider.value} BPM`;
});

document.getElementById("generateMusicButton").addEventListener("click", async () => {
    const generateBtn = document.getElementById("generateMusicButton");
    const resultElement = document.getElementById("generationResult");
    const sessionId = localStorage.getItem('session_id');

    generateBtn.disabled = true;
    generateBtn.textContent = "Генерирую...";
    resultElement.textContent = "🎵 Создаю уникальный трек...";

    try {
        const genreChip = document.querySelector("#genreChipGroup .chipButtonActive")?.textContent.trim();
        const moodChip = document.querySelector("#moodChipGroup .chipButtonActive")?.textContent.trim();
        const instrumentChip = document.querySelector("#instrumentChipGroup .chipButtonActive")?.textContent.trim();
        const lengthValue = lengthSlider.value;
        const tempoValue = tempoSlider.value;
        const descriptionValue = document.getElementById("descriptionInput").value.trim();

        if (!genreChip || !moodChip || !instrumentChip) {
            resultElement.innerHTML = `
                ❌ <strong>Выберите:</strong><br>
                • Жанр<br>
                • Настроение<br>
                • Инструменты
            `;
            return;
        }

        if (!sessionId) {
            resultElement.innerHTML = `
                ❌ <strong>Ошибка авторизации!</strong><br>
                Войдите в аккаунт
            `;
            window.location.href = '/sso.html';
            return;
        }

        const response = await fetch('/generate_music', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Session-ID': sessionId
            },
            body: JSON.stringify({
                genre: genreChip,
                mood: moodChip,
                instrument: instrumentChip,
                length: lengthValue,
                tempo: tempoValue,
                description: descriptionValue,
                session_id: sessionId
            })
        });

        const result = await response.json();

        if (result.success) {
            // ✅ АВТОСКАЧИВАНИЕ БЕЗ КНОПКИ
            const downloadLink = document.createElement('a');
            downloadLink.href = result.download_url;
            downloadLink.download = `ruzvuk_${result.filename}`;
            downloadLink.style.display = 'none';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // ✅ ПОДСКАЗКИ ПОД КНОПКОЙ
            resultElement.innerHTML = `
                ✅ <strong>🎵 Трек готов и скачивается!</strong><br><br>
                <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin-top: 10px; font-size: 14px;">
                    <strong>💡 Советы:</strong><br>
                    • Файл сохранился в <strong>Загрузки</strong><br>
                    • <strong>"Результаты"</strong> → управление треками<br>
                    • Создайте новый трек для плейлиста 🎶
                </div>
            `;
        } else {
            resultElement.innerHTML = `
                ❌ <strong>Ошибка:</strong><br>
                ${result.error || 'Неизвестная ошибка'}
            `;
        }
    } catch (error) {
        resultElement.innerHTML = `
            ❌ <strong>Нет соединения</strong><br>
            Проверьте интернет и обновите страницу
        `;
        console.error(error);
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = "🎵 Сгенерировать новый трек";
    }
});

async function checkAuthStatus() {
    const sessionId = localStorage.getItem('session_id');
    if (sessionId) {
        try {
            const response = await fetch(`/api/check-session/${sessionId}`);
            const result = await response.json();
            if (result.success) {
                document.getElementById('logoutButton').style.display = 'inline-block';
                return;
            }
        } catch (e) {
            console.log('Сессия истекла');
        }
    }
    window.location.href = '/sso.html';
}

let logoutResolve;

function showLogoutModal() {
    const modal = document.getElementById('logoutModal');
    modal.classList.add('active');
    
    return new Promise((resolve) => {
        logoutResolve = resolve;
        
        document.getElementById('confirmLogout').onclick = async () => {
            modal.classList.remove('active');
            resolve(true);
            
            const sessionId = localStorage.getItem('session_id');
            if (sessionId) {
                try {
                    await fetch(`/api/logout/${sessionId}`, { method: 'POST' });
                } catch (e) {
                    console.log('Logout API недоступен');
                }
            }
            localStorage.removeItem('session_id');
            window.location.href = '/sso.html';
        };
        
        document.getElementById('cancelLogout').onclick = () => {
            modal.classList.remove('active');
            resolve(false);
        };
    });
}

document.getElementById('logoutButton')?.addEventListener('click', async () => {
    const confirmed = await showLogoutModal();
});

window.addEventListener('load', checkAuthStatus);

// 🔗 НАВИГАЦИЯ МЕЖДУ СТРАНИЦАМИ
document.addEventListener('DOMContentLoaded', function() {
    // Кнопка "Результаты" → /result
    document.querySelector('.navigationButton:nth-child(2)')?.addEventListener('click', function() {
        window.location.href = '/result';
    });
    
    // Кнопка "Создать" → /app
    document.querySelector('.navigationButton:nth-child(1)')?.addEventListener('click', function() {
        window.location.href = '/app';
    });
    
    // Активная вкладка
    const navButtons = document.querySelectorAll('.navigationButton');
    navButtons.forEach((btn) => {
        btn.addEventListener('click', function(e) {
            navButtons.forEach(b => b.classList.remove('navigationButtonActive'));
            this.classList.add('navigationButtonActive');
        });
    });
});