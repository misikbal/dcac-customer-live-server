import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket } from 'net';
import type { Server as IOServer } from 'ws';

interface CustomSocket extends Socket {
  server: HTTPServer & {
    ws?: IOServer;
  };
}

interface CustomNextApiResponse extends NextApiResponse {
  socket: CustomSocket;
}

let WebSocketServer: any;
let WS: any;

// WebSocket modülünü dinamik olarak import et
async function initializeWebSocket() {
  if (!WebSocketServer) {
    const ws = await import('ws');
    WebSocketServer = ws.WebSocketServer;
    WS = ws.WebSocket;
  }
}

// WebSocket sunucusunu başlat
async function createWebSocketServer() {
  await initializeWebSocket();
  return new WebSocketServer({ noServer: true });
}

let wss: any = null;
const clients = new Set();

async function setupWebSocketServer() {
  wss = await createWebSocketServer();

  wss.on('connection', (ws: any) => {
    clients.add(ws);

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  return wss;
}

// Node.js backend'den gelen WebSocket bağlantısı
let backendWs: any = null;

function disconnectBackend() {
  if (backendWs) {
    backendWs.close();
    backendWs = null;
  }
}

async function connectToBackend() {
  if (typeof window === 'undefined' && !backendWs) {
    try {
      await initializeWebSocket();
      const newWs = new WS('ws://oriontecno.com/ws');

      newWs.on('open', () => {
        console.log('Connected to backend WebSocket');
        backendWs = newWs;
      });

      newWs.on('message', (data: Buffer) => {
        clients.forEach((client: any) => {
          if (client.readyState === WS.OPEN) {
            try {
              client.send(data);
            } catch (error: unknown) {
              console.error('Error sending data to client:', error);
              client.close();
              clients.delete(client);
            }
          }
        });
      });

      newWs.on('close', () => {
        console.log('Backend WebSocket connection closed. Reconnecting...');
        disconnectBackend();
        setTimeout(connectToBackend, 5000);
      });

      newWs.on('error', (error: Error) => {
        console.error('Backend WebSocket error:', error);
        disconnectBackend();
        setTimeout(connectToBackend, 5000);
      });
    } catch (error: unknown) {
      console.error('Error connecting to backend:', error);
      disconnectBackend();
      setTimeout(connectToBackend, 5000);
    }
  }
}

// İlk bağlantıyı başlat
connectToBackend();

export default async function handler(
  req: NextApiRequest,
  res: CustomNextApiResponse
) {
  if (!res.socket.server.ws) {
    res.socket.server.ws = await setupWebSocketServer();

    res.socket.server.on('upgrade', (request: any, socket: any, head: any) => {
      wss.handleUpgrade(request, socket, head, (ws: any) => {
        wss.emit('connection', ws, request);
      });
    });
  }

  res.end();
}

// WebSocket sunucusunu temizle
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing WebSocket connections...');
    clients.forEach((client: any) => {
      try {
        client.close();
      } catch (error: unknown) {
        console.error('Error closing client connection:', error);
      }
    });
    disconnectBackend();
    try {
      wss?.close();
    } catch (error: unknown) {
      console.error('Error closing WebSocket server:', error);
    }
  });
}