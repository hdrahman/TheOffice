import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io.connect("http://127.0.0.1:5000");

function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("Alex"); // Replace with sender name

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      const messageData = {
        message,
        sender: username,
        recipient: "User2", // Replace with the intended recipient
      };
      socket.emit("send_message", messageData);
      setMessages((prevMessages) => [...prevMessages, messageData]);
      setMessage("");
    }
  };

  return (
    <div>
      <h1>Chat</h1>
      <div style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px", height: "300px", overflowY: "scroll" }}>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.sender}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message"
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default Chat;
