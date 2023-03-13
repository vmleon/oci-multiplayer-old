let socket;
let lobbyPlayers = [];

// const createGameButton = document.getElementById("create-game-button");
// createGameButton.addEventListener("click", connect);
const startButton = document.getElementById("startButton");
startButton.addEventListener("click", connect);

function connect() {
    const inputNameValue = document.getElementsByName("name")[0].value;
    if (inputNameValue.length) {
      localStorage.setItem("yourName", inputNameValue);
    }
    const input = document.getElementById("input");
    input.remove();

        // Add this line to unhide the lobby CSS
        document.getElementById('lobby').style.display = 'block';




    }