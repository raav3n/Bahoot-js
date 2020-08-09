//HTML Elements
let clientId = null;
let playerColor = null;
let gameId = null;
let ws = new WebSocket("ws://localhost:5555");
const btnCreate = document.getElementById("btnCreate");
const btnJoin = document.getElementById("btnJoin");
const txtGameId = document.getElementById("txtGameId");
const divPlayers = document.getElementById("divPlayers");
const divBoard = document.getElementById("divBoard");

//wiring Elements
btnJoin.addEventListener("click", e =>
{
  console.log("join clicked");
  if(gameId === null) gameId = txtGameId.value;

  const payload =
  {
    "method" : "join",
    "clientId" : clientId,
    "gameId" : gameId
  }
  ws.send(JSON.stringify(payload));
})

btnCreate.addEventListener("click", e =>
{
  const payload =
  {
    "method" : "create",
    "clientId" : clientId
  }

  ws.send(JSON.stringify(payload));

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

  //create
  if(response.method === "create")
  {
    gameId = response.game.id;
    console.log("game successfully created with id " + response.game.id + " with " + response.game.balls + " balls.");
    document.getElementById("lobbyId").innerHTML = response.game.id;
  }

  //update
  if(response.method === "update")
  {
    if(!response.game.state) return;

    for(const b of Object.keys(response.game.state))
    {
      const color = response.game.state[b];
      const ballObject = document.getElementById("ball" + b);
      ballObject.style.backgroundColor = color;
    }
  }

  //joined
  if(response.method === "join")
  {
    console.log("join response");
    const game = response.game;

    while(divPlayers.firstChild) divPlayers.removeChild(divPlayers.firstChild);

    game.clients.forEach(c =>
    {
      const d = document.createElement("div");
      d.style.width = "200px";
      d.style.background = c.color;
      d.textContent = c.clientId;
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
        const payload =
        {
          "method" : "play",
          "clientId" : clientId,
          "gameId" : gameId,
          "ballId" : b.tag,
          "color" : playerColor
        }

        ws.send(JSON.stringify(payload));
      })
      divBoard.appendChild(b);
    }
  }
}
