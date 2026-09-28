import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Lazily creates (and reuses) a single Socket.IO connection to the backend.
 * Connects to the same origin the page was loaded from — in dev that's the
 * Vite dev server, which proxies /socket.io through to server/index.js (see
 * vite.config.ts); in production the Express server serves both the app and
 * the socket on the same port, so no special config is needed there.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });
  }
  return socket;
}
