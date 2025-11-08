import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useSocket = () => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      console.log('✓ WebSocket connected');
      setConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('✗ WebSocket disconnected');
      setConnected(false);
    });

    socketRef.current.on('connected', (data) => {
      console.log('Server says:', data);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const joinConversation = (conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('join_conversation', { conversation_id: conversationId });
    }
  };

  const leaveConversation = (conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('leave_conversation', { conversation_id: conversationId });
    }
  };

  const onNewMessage = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('new_message', callback);
    }
  };

  const offNewMessage = () => {
    if (socketRef.current) {
      socketRef.current.off('new_message');
    }
  };

  const sendTyping = (conversationId, userId, username) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('typing', { conversation_id: conversationId, user_id: userId, username });
    }
  };

  const onUserTyping = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('user_typing', callback);
    }
  };

  const offUserTyping = () => {
    if (socketRef.current) {
      socketRef.current.off('user_typing');
    }
  };

  return {
    socket: socketRef.current,
    connected,
    joinConversation,
    leaveConversation,
    onNewMessage,
    offNewMessage,
    sendTyping,
    onUserTyping,
    offUserTyping,
  };
};
