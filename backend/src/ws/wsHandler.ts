import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

const clients: Set<WebSocket> = new Set();

export function setupWsHandler(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
    clients.add(ws);

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on('error', () => {
      clients.delete(ws);
    });
  });
}

export function broadcast(event: object): void {
  const data = JSON.stringify(event);
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}
