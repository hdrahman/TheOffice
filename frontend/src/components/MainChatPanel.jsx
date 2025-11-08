import React, { useEffect, useState } from 'react';

const MainChatPanel = ({ conversationId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [conversation, setConversation] = useState(null);

  // Fetch user information
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/user`);
        if (!response.ok) throw new Error(`User fetch failed with status ${response.status}`);
        
        const data = await response.json();
        setCurrentUser(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUser();
  }, []);

  // Fetch conversation details
  useEffect(() => {
    const fetchConversation = async () => {
      if (conversationId) {
        try {
          const response = await fetch(`http://127.0.0.1:5000/conversations/${conversationId}`);
          if (!response.ok) throw new Error(`Conversation fetch failed with status ${response.status}`);
          
          const data = await response.json();
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
      if (conversationId) {
        try {
          const response = await fetch(`http://127.0.0.1:5000/conversations/${conversationId}/messages`);
          if (!response.ok) throw new Error(`Messages fetch failed with status ${response.status}`);
          
          const data = await response.json();

          // Mark messages as belonging to the current user if the senderId matches
          setMessages(
            data.map((msg) => ({
              ...msg,
              isCurrentUser: msg.senderId === currentUser?.userId,
            }))
          );
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      }
    };

    fetchMessages();
  }, [conversationId, currentUser]);

  // Send a new message
  const sendMessage = async () => {
    if (newMessage.trim() && currentUser) {
      const message = {
        text: newMessage,
        senderId: currentUser.userId,
        timestamp: new Date().toISOString(),
      };

      try {
        const response = await fetch(`http://127.0.0.1:5000/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });

        if (!response.ok) throw new Error(`Message send failed with status ${response.status}`);
        
        const newMessageData = await response.json();
        
        // Immediately update messages with the new message
        setMessages((prevMessages) => [
          ...prevMessages,
          { ...newMessageData, isCurrentUser: true },
        ]);

        setNewMessage(''); // Clear input field
      } catch (error) {
        console.error('Error sending message:', error);
      }
    } else {
      console.warn("Message is empty or user is not set");
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      {conversation && (
        <div className="mb-4 text-xl font-bold text-center">
          Chatting with: {conversation.otherParticipantName || conversation.name}
        </div>
      )}
      <div className="flex-1 overflow-y-auto space-y-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 ${msg.isCurrentUser ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block p-2 rounded-lg ${
                msg.isCurrentUser
                  ? 'bg-blue-500 text-white ml-auto' // Right-aligned message styling
                  : 'bg-gray-200 text-gray-800 mr-auto' // Left-aligned message styling
              }`}
            >
              {msg.text}
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
          placeholder="Type a message..."
        />
        <button
          className="p-2 bg-blue-500 text-white rounded-r-lg"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default MainChatPanel;
