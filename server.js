
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const { WebcastPushConnection } = require('tiktok-live-connector');

const tiktokUsername = "grantsylvester2";

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

let clients = [];

wss.on('connection', (ws) => {
  clients.push(ws);
  ws.on('close', () => {
    clients = clients.filter((client) => client !== ws);
  });
});

function broadcast(msg) {
  const json = JSON.stringify(msg);
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  });
}

const tiktok = new WebcastPushConnection(tiktokUsername);

tiktok.connect().then(state => {
  console.log(`✅ Connected to room ID: ${state.roomId}`);
}).catch(err => {
  console.error("❌ Failed to connect:", err);
});

tiktok.on('chat', data => {
  broadcast({
    type: 'chat',
    text: data.comment,
    sender: data.uniqueId
  });
});

tiktok.on('gift', data => {
  const amount = data.diamondCount || 1;
  broadcast({
    type: 'gift',
    amount,
    sender: data.uniqueId
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
