import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

class SocketManager {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect(userId, username) {
    if (this.socket) {
      console.log('Socket already connected');
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
    });

    this.socket.on('connect', () => {
      console.log('✓ Socket connected:', this.socket.id);
      this.connected = true;
      
      // Join the office room
      this.socket.emit('join_office', { user_id: userId, username });
    });

    this.socket.on('disconnect', () => {
      console.log('✗ Socket disconnected');
      this.connected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.emit('leave_office');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  emitPlayerMove(position, rotation) {
    if (this.socket && this.connected) {
      this.socket.emit('player_move', { position, rotation });
    }
  }

  onCurrentPlayers(callback) {
    if (this.socket) {
      this.socket.on('current_players', callback);
    }
  }

  onPlayerJoined(callback) {
    if (this.socket) {
      this.socket.on('player_joined', callback);
    }
  }

  onPlayerMoved(callback) {
    if (this.socket) {
      this.socket.on('player_moved', callback);
    }
  }

  onPlayerLeft(callback) {
    if (this.socket) {
      this.socket.on('player_left', callback);
    }
  }
}

// Export singleton
const socketManager = new SocketManager();
export default socketManager;