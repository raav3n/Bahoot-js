const http = require("http");
const express = require('express');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require("constants");
const app = express();
app.use(express.static('public'));
app.listen(5050, ()=>console.log("Listening on http port 5050"));
const websocketServer = require("websocket").server;
const httpServer = http.createServer();
httpServer.listen(5555, () => console.log("Listening.. on 5555"));

//client hashmap
const clients = {};
const games = {};

const wsServer = new websocketServer(
{
  "httpServer": httpServer
})
wsServer.on("request", request =>
{
  //connect
  const connection = request.accept(null, request.origin);
  connection.on("close", () => console.log("closed!"));
  connection.on("message", message =>
  {
    const result = JSON.parse(message.utf8Data);
    //I have received a message from the client

    //a user wants to create a new game
    if(result.method === "create")
    {
      const clientId = result.clientId;
      const gameId = game_guid();
      games[gameId] =
      {
        "id" : gameId,
        "balls" : 20,
        "clients" : []
      }
      const payload =
      {
        "method" : "create",
        "game" : games[gameId]
      }

      const con = clients[clientId].connection;
      con.send(JSON.stringify(payload));

    }

    //a client wants to join
    if(result.method === "join")
    {
      const clientId = result.clientId;
      const gameId = result.gameId;
      const name = result.name;
      
      if(!(gameId in games))
      {
        const payload =
        {
          "method" : "error",
          "reason" : "game ID does not exist. Please check ID."
        }
        clients[clientId].connection.send(JSON.stringify(payload));
      }
      else if(games[gameId].clients.length >= 3)
      {
        const payload =
        {
          "method" : "error",
          "reason" : "lobby is full."
        }
        clients[clientId].connection.send(JSON.stringify(payload));
      }
      else
      {
        const score = 0;

        const color = {"0": "Red", "1": "Green", "2": "Blue"}[games[gameId].clients.length]
        games[gameId].clients.push
        ({
          "clientId" : clientId,
          "name" : name,
          "color" : color,
          "score" : score
        })

        if(games[gameId].clients.length === 1) updateGameState();
  
        const payload =
        {
          "method" : "join",
          "game" : games[gameId]
        }
  
        //loop through clients to let them know people have joined
        games[gameId].clients.forEach(c =>
        {
          clients[c.clientId].connection.send(JSON.stringify(payload))
        })
      }
    }

    //User plays
    if(result.method === "play")
    {
      const clientId = result.clientId;
      const gameId = result.gameId;
      const ballId = result.ballId;
      const color = result.color;
      const score = result.score;

      let state = games[gameId].state;

      if(!state) state = {}

      state[ballId] = color;
      games[gameId].state = state;

     games[gameId].clients[contains(games[gameId].clients, "clientId", clientId)].score = score;
    }

  })

  //generate new client id
  const clientId = guid();
  clients[clientId] =
  {
    "connection" : connection
  }

  const payload =
  {
    "method" : "connect",
    "clientId" : clientId
  }
  //send client connect
  connection.send(JSON.stringify(payload));

})



















//functions
function updateGameState()
{
  for(const g of Object.keys(games))
  {
    const game = games[g];
    const payload =
    {
      "method" : "update",
      "game" : game
    }
    game.clients.forEach(c =>
    {
      clients[c.clientId].connection.send(JSON.stringify(payload));
    })
  }
  setTimeout(updateGameState, 500);
}


function S4()
{
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}

const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();

function game_guid()
{
  const char = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v'];
  const num = ['1','2','3','4','5','6','7','8','9','0'];
  let temp = ['#'];
  let counter = 0;
  while(counter < 7)
  {
    let upper = Math.floor(Math.random() * Math.floor(2));
    if(upper == 0)
    {
      temp.push(char[Math.floor(Math.random() * Math.floor(10))].toUpperCase());
      temp.push(num[Math.floor(Math.random() * Math.floor(10))]);
    }
    else
    {
      temp.push(char[Math.floor(Math.random() * Math.floor(10))]);
    }
    counter += 1;
  }
  temp = temp.join('');
  return temp;
}

function contains(arr, key, val) {
  let count = 0;
  for (var i = 0; i < arr.length; i++) {
      if(arr[i][key] === val) break;
    count ++;
  }
  return count;
}