import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { useSocket } from '../hooks/useSocket';

const MainChatPanel = ({ conversationId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState(null);
  const { user } = useAuth();
  const { connected, joinConversation, leaveConversation, onNewMessage, offNewMessage } = useSocket();

  // Fetch conversation details
  useEffect(() => {
    const fetchConversation = async () => {
      if (conversationId) {
        try {
          const data = await api.getConversation(conversationId);
          setConversation(data);
        } catch (error) {
          console.error('Error fetching conversation data:', error);
        }
      }
    };

    fetchConversation();
  }, [conversationId]);

  // Fetch messages for the conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (conversationId && user) {
        try {
          const data = await api.getMessages(conversationId);

          // Mark messages as belonging to the current user
          setMessages(
            data.map((msg) => ({
              ...msg,
              isCurrentUser: msg.sender_id === user.id,
            }))
          );
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      }
    };

    fetchMessages();
  }, [conversationId, user]);

  // WebSocket: Join conversation room and listen for new messages
  useEffect(() => {
    if (conversationId && connected) {
      joinConversation(conversationId);

      // Listen for new messages
      onNewMessage((data) => {
        if (data.conversation_id === conversationId) {
          const msg = data.message;
          // Only add if not already in messages (avoid duplicates from our own sends)
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === msg.id);
            if (!exists) {
              return [...prev, { ...msg, isCurrentUser: msg.sender_id === user?.id }];
            }
            return prev;
          });
        }
      });

      // Cleanup: leave room and stop listening
      return () => {
        leaveConversation(conversationId);
        offNewMessage();
      };
    }
  }, [conversationId, connected, user, joinConversation, leaveConversation, onNewMessage, offNewMessage]);

  // Send a new message
  const sendMessage = async () => {
    if (newMessage.trim() && user) {
      try {
        // Don't add to messages here - WebSocket will handle it
        await api.sendMessage(conversationId, newMessage);
        setNewMessage(''); // Clear input field
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      {conversation && (
        <div className="mb-4 text-xl font-bold text-center flex items-center justify-center gap-2">
          <span>Chatting with: {conversation.otherParticipantName || conversation.name}</span>
          {connected && <span className="text-xs text-green-500">● Live</span>}
        </div>
      )}
      <div className="flex-1 overflow-y-auto space-y-3">
        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`p-2 ${msg.isCurrentUser ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block p-2 rounded-lg ${
                msg.isCurrentUser
                  ? 'bg-blue-500 text-white ml-auto'
                  : 'bg-gray-200 text-gray-800 mr-auto'
              }`}
            >
              {!msg.isCurrentUser && msg.users && (
                <div className="text-xs opacity-75 mb-1">
                  {msg.users.username || msg.users.full_name}
                </div>
              )}
              <div>{msg.content || msg.text}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex">
        <input
          type="text"
          className="flex-1 p-2 border rounded-l-lg"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
        />
        <button
          className="p-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 disabled:opacity-50"
          onClick={sendMessage}
          disabled={!newMessage.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default MainChatPanel;
