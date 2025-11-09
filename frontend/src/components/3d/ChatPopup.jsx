import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const ChatPopup = () => {
  const [isContactListOpen, setIsContactListOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await api.getConversations();
        setConversations(data);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Fetch messages for the selected conversation
  const handleConversationSelect = async (conversation) => {
    setSelectedConversation(conversation);
    setIsContactListOpen(false);

    try {
      const data = await api.getMessages(conversation.id);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedConversation) return;

    try {
      const msgData = await api.sendMessage(selectedConversation.id, newMessage);
      // Update messages locally to reflect the new message immediately
      setMessages((prevMessages) => [...prevMessages, { ...msgData, isCurrentUser: true }]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-surface rounded-2xl shadow-2xl overflow-hidden border border-border">
      {!isContactListOpen && !selectedConversation && (
        <div
          onClick={() => setIsContactListOpen(true)}
          className="cursor-pointer w-72 bg-primary text-white text-center py-3 rounded-2xl shadow-lg hover:bg-primary-hover transition duration-200 font-medium"
        >
          Contacts
        </div>
      )}

      {isContactListOpen && !selectedConversation && (
        <div className="p-3 space-y-3 overflow-y-auto h-72 w-72">
          <div className="sticky top-0 bg-surface z-10 p-2 border-b border-border">
            <div className="flex justify-between items-center">
              <div className="font-bold text-text-primary">Conversations</div>
              <button onClick={() => setIsContactListOpen(false)} className="text-text-secondary hover:text-text-primary">
                ✕
              </button>
            </div>
          </div>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="flex items-center space-x-2 p-2 rounded-lg cursor-pointer hover:bg-primary-tint transition duration-200"
              onClick={() => handleConversationSelect(conv)}
            >
              <div className="w-8 h-8 bg-brown-tint rounded-full"></div>
              <div>
                <div className="font-medium text-text-primary">{conv.name}</div>
                <div className="text-xs text-text-secondary">{conv.lastMessage}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedConversation && (
        <div className="flex flex-col h-64 w-96">
          <div className="p-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setSelectedConversation(null);
                  setMessages([]);
                }}
                className="text-gray-500 hover:text-gray-800 text-lg"
              >
                ←
              </button>
              <div>
                <div className="font-medium text-text-primary">{selectedConversation.name}</div>
              </div>
            </div>
            <button onClick={() => setSelectedConversation(null)} className="text-text-secondary hover:text-text-primary">✕</button>
          </div>

          <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-background">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-2 ${msg.sender_id === user?.id ? 'text-right' : 'text-left'}`}
              >
                <div
                  className={`inline-block p-2 rounded-lg ${msg.sender_id === user?.id
                    ? 'bg-primary text-white ml-auto' // Right-aligned styling for current user
                    : 'bg-green-tint text-text-primary mr-auto' // Left-aligned styling for others
                    }`}
                >
                  {msg.content || msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-border flex items-center space-x-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-focus focus:border-transparent bg-surface"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button onClick={sendMessage} className="bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary-hover transition duration-200 font-medium">
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPopup;
