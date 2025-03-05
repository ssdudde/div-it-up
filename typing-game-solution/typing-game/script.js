const imageElemnt = document.getElementById("char-img")
const messageElement = document.getElementById("final")
const typedElement = document.getElementById("typed")
const url = "https://api.jikan.moe/v4/random/characters"
let char_name = ''
let max_attempts = 10


function stt() {
    if (attempts >= max_attempts) {
        messageElement.innerText = `Game Over! Your Score: ${score}/${max_attempts}`;
        return; 
    }

    typedElement.value = ''
    messageElement.innerHTML = ''
    typedElement.focus()

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network not ok')
            }
            return response.json()
        })
        .then(data => {
            imageElemnt.src = data.data.images.jpg.image_url
            char_name = data.data.name
            console.log(char_name)
        })
        .catch(error => console.error("Error fetching character:", error));
}

function check(event) {
    if (event.key === "Enter") {
        const typedVal = typedElement.value.trim().toLowerCase();
        
        if (typedVal === char_name.toLowerCase()) {
            score++;
            messageElement.innerText = "Correct!"
        } else {
            messageElement.innerText = `Wrong! Correct answer: ${char_name}`
        }

        attempts++;

        if (attempts < max_attempts) {
            setTimeout(stt, 2000)
        } else {
            messageElement.innerText = `Game Over! Your Score: ${score}/${max_attempts}`;
        }
    }
}

document.getElementById("strt").addEventListener("click", () => {
    attempts = 0;
    score = 0;
    stt();
});

typedElement.addEventListener("keydown", check);
