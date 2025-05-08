import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector';

// TikTok username to connect to
const tiktokUsername = 'grantsylvester2';

// Required to handle __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app and server
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Track connected clients
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
    if (ws.readyState === ws.OPEN) {
      ws.send(json);
    }
  });
}

// Initialize TikTok connection
const connection = new TikTokLiveConnection(tiktokUsername);

// Connect to the TikTok livestream
connection.connect().then(state => {
  console.log(`✅ Connected to room ID: ${state.roomId}`);
}).catch(err => {
  console.error('❌ Failed to connect:', err);
});

// Listen for chat messages
connection.on(WebcastEvent.Chat, data => {
  broadcast({
    type: 'chat',
    text: data.comment,
    sender: data.nickname || data.uniqueId
  });
});

// Listen for gift events
connection.on(WebcastEvent.Gift, data => {
  const amount = data.diamondCount || 1;
  broadcast({
    type: 'gift',
    amount,
    sender: data.nickname || data.uniqueId
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
