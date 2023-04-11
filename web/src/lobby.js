// const createGameButton = document.getElementById("create-game-button");
// createGameButton.addEventListener("click", connect);

const startButton = document.getElementById("startButton");
startButton.addEventListener("click", connect);

export async function getLeaderBoard() {
  const response = await fetch(`/api/top/score`, {
    headers: { "Content-type": "application/json" },
  });
  const leaderBoard = await response.json();
  buildTable(leaderBoard);
  return leaderBoard;
}

function connect() {
  const inputNameValue = document.getElementsByName("name")[0].value;
  if (inputNameValue.length) {
    localStorage.setItem("yourName", inputNameValue);
  }
  const input = document.getElementById("input");
  input.remove();

  // Add this line to unhide the lobby CSS
  document.getElementById("lobby").style.display = "block";
}

function buildTable(data) {
  var table = document.getElementById("playerTable");
  for (var i = 0; i < data.length; i++) {
    var row = `<tr class="item-id-${data[i].id}"> <td>${data[i].name}</td> <td>${data[i].score}</td></tr>`;
    table.innerHTML += row;
  }
}
