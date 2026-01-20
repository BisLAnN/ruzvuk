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
            resultElement.textContent = "❌ Выберите жанр, настроение и инструменты!";
            return;
        }

        const response = await fetch('/generate_music', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                genre: genreChip,
                mood: moodChip,
                instrument: instrumentChip,
                length: lengthValue,
                tempo: tempoValue,
                description: descriptionValue
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            resultElement.innerHTML = `
                ✅ <strong>Трек готов!</strong><br>
                <a href="${result.download_url}" download class="download-link">📥 Скачать MP3</a>
            `;
        } else {
            resultElement.textContent = `❌ Ошибка: ${result.error}`;
        }
    } catch (error) {
        resultElement.textContent = "❌ Ошибка соединения с сервером";
        console.error(error);
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = "Сгенерировать музыку";
    }
});