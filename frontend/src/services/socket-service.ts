/**
 * Socket.io Client Service for Real-Time Bed Management
 * Connects to backend WebSocket server - falls back to mock mode when server unavailable
 */

import { io, Socket } from 'socket.io-client';
import type { BedUpdateEvent } from '../types/bed.types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface SocketEventHandlers {
  onBedStatusUpdate?: (data: BedUpdateEvent) => void;
  onEmergencyAlert?: (data: unknown) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onConnectionStatus?: (status: ConnectionStatus) => void;
}

/**
 * Initialize and connect to Socket.io server
 */
export function connectSocket(handlers?: SocketEventHandlers): Socket | null {
  if (socket?.connected) {
    handlers?.onConnectionStatus?.('connected');
    return socket;
  }

  handlers?.onConnectionStatus?.('connecting');

  try {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      handlers?.onConnectionStatus?.('connected');
      handlers?.onConnect?.();
    });

    socket.on('disconnect', (reason) => {
      handlers?.onConnectionStatus?.(reason === 'io server disconnect' ? 'disconnected' : 'error');
      handlers?.onDisconnect?.(reason);
    });

    socket.on('connect_error', () => {
      handlers?.onConnectionStatus?.('error');
    });

    socket.on('bed-status-update', (data: BedUpdateEvent) => {
      handlers?.onBedStatusUpdate?.(data);
    });

    socket.on('emergency-alert', (data: unknown) => {
      handlers?.onEmergencyAlert?.(data);
    });

    return socket;
  } catch (err) {
    handlers?.onConnectionStatus?.('error');
    return null;
  }
}

/**
 * Disconnect from Socket.io server
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get current socket instance (may be null)
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}
