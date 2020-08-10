//HTML Elements
let clientId = null;
let playerColor = null;
let name = null;
let gameId = null;
let score = null;
let ws = new WebSocket("ws://localhost:5555");
const btnCreate = document.getElementById("btnCreate");
const btnJoin = document.getElementById("btnJoin");
const txtGameId = document.getElementById("txtGameId");
const divPlayers = document.getElementById("divPlayers");
const divBoard = document.getElementById("divBoard");
const error = document.getElementById("errors")
const playerName = document.getElementById("playerName");

//wiring Elements
btnJoin.addEventListener("click", e =>
{
  gameId = txtGameId.value;
  name = playerName.value;

  if(gameId.length == 0 && name.length == 0) error.innerHTML = "Please enter a Game ID and Nickname.";
  else if(gameId.length == 0) error.innerHTML = "Please enter a Game ID.";
  else if(name.length == 0) error.innerHTML = "Please enter a username.";
  else
  {
    error.innerHTML = "";

    const payload =
    {
      "method" : "join",
      "clientId" : clientId,
      "gameId" : gameId,
      "name" : name
    }
    ws.send(JSON.stringify(payload));
  }
})

btnCreate.addEventListener("click", e =>
{
  if(playerName.value.length == 0) error.innerHTML = "Please enter Nickname before creating a lobby.";
  else
  {
    error.innerHTML = "";

    const payload =
    {
      "method" : "create",
      "clientId" : clientId
    }

    ws.send(JSON.stringify(payload));
  }
})

ws.onmessage = message =>
{
  const response = JSON.parse(message.data);

  //connect
  if(response.method === "connect")
  {
    clientId = response.clientId;
    console.log("client id set successfully " + clientId);
  }

  //error
  if(response.method === "error")
  {
    const reason = response.reason; 
    error.innerHTML = "Sorry " + reason;
  }

  //create
  if(response.method === "create")
  {
    gameId = response.game.id;
    console.log("game successfully created with id " + response.game.id + " with " + response.game.balls + " balls.");
 
    hideTemp();

    //join self
    const payload =
    {
      "method" : "join",
      "clientId" : clientId,
      "gameId" : gameId,
      "name" : playerName.value
    }
    ws.send(JSON.stringify(payload));
  }

  //update
  if(response.method === "update")
  {
    if(!response.game.state) return;
    const score = response.game.clients[contains(response.game.clients, "clientId", clientId)].score;
    const name = response.game.clients[contains(response.game.clients, "clientId", clientId)].name;

    for(const b of Object.keys(response.game.state))
    {
      const color = response.game.state[b];
      const ballObject = document.getElementById("ball" + b);
      ballObject.style.backgroundColor = color;
      document.getElementById(name+"Score").textContent = name + " Score " + score;
    }
  }

  //joined
  if(response.method === "join")
  {
    hideTemp();
    document.getElementById("lobbyId").innerHTML = "Game ID is: " + response.game.id;
    const game = response.game;
    
    while(divPlayers.firstChild) divPlayers.removeChild(divPlayers.firstChild);

    game.clients.forEach(c =>
    {
      score = c.score;
      const d = document.createElement("div");
      d.id = c.name + "Score";
      d.style.width = "200px";
      d.style.background = c.color;
      d.textContent = c.name + " Score: " + score ;
      divPlayers.appendChild(d);

      if(c.clientId == clientId) playerColor = c.color;
    })
    while(divBoard.firstChild) divBoard.removeChild(divBoard.firstChild);

    for(let i = 0;i < game.balls; i++)
    {
      const b = document.createElement("button");
      b.id = "ball" + (i + 1);
      b.tag = i + 1;
      b.textContent = i +1;
      b.style.width = "150px";
      b.style.width = "150px";
      b.addEventListener("click", e =>
      {
        b.style.background = playerColor;
        score ++;

        const payload =
        {
          "method" : "play",
          "clientId" : clientId,
          "gameId" : gameId,
          "ballId" : b.tag,
          "color" : playerColor,
          "score" : score
        }
        ws.send(JSON.stringify(payload));
      })
      divBoard.appendChild(b);
    }
  }
}






function hide(id)
{
  id.style.display("none");
}
function hideTemp()
{
  //hide create/join icons 
  btnCreate.style.display = "none";
  btnJoin.style.display = "none";
  txtGameId.style.display = "none";
  playerName.style.display = "none";
}
function contains(arr, key, val) {
  let count = 0;
  for (var i = 0; i < arr.length; i++) {
      if(arr[i][key] === val) break;
    count ++;
  }
  return count;
}