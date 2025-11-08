import React, { useEffect, useState } from 'react';
import api from '../lib/api';

const ConversationList = ({ onSelectConversation, selectedConversationId }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedTab, setSelectedTab] = useState("Direct");

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await api.getConversations();
        setConversations(data);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    fetchConversations();
  }, []);

  // Filter conversations based on the selected tab and conversation type
  const filteredConversations = conversations.filter((convo) => {
    if (selectedTab === "Direct") return convo.type === "direct";
    if (selectedTab === "Community") return convo.type === "community";
    if (selectedTab === "Team") return convo.type === "team";
    return false;
  });

  return (
    <div className="h-full p-4 space-y-4 overflow-y-auto">
      <div className="font-bold text-gray-700 text-xl mb-2 text-center">Messages</div>
      <div className="flex justify-center space-x-4 mb-4">
        {["Direct", "Community", "Team"].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`flex-grow py-2 px-4 rounded-full text-center transition-all duration-200 ${
              selectedTab === tab ? "bg-blue-500 text-white text-lg py-3" : "bg-gray-200 text-gray-700 text-base"
            } hover:bg-blue-500 hover:text-white`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((convo) => (
            <div
              key={convo.id}
              className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer ${
                convo.id === selectedConversationId ? 'bg-blue-100' : ''
              }`}
              onClick={() => onSelectConversation(convo.id)}
            >
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div>
                <div className="font-medium text-gray-800">{convo.name}</div>
                <div className="text-sm text-gray-500 truncate">{convo.lastMessage}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-500 text-center">No conversations available</div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
