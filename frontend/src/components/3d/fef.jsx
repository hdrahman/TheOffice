import React, { useState } from 'react';
import ConversationList from '../functions/ConversationList';
import MainChatPanel from './MainChatPanel';

function Messaging() {
  const [selectedConversationId, setSelectedConversationId] = useState(null);

  return (
    <div className="h-screen bg-gray-100 flex">
      {/* Sidebar for Conversation List */}
      <div className="bg-white border-r border-gray-200 h-full w-1/4">
        <ConversationList onSelectConversation={setSelectedConversationId} />
      </div>
      
      {/* Main Chat Panel stretching to full width */}
      <div className="flex-1 flex flex-col h-full">
        {selectedConversationId ? (
          <MainChatPanel conversationId={selectedConversationId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
}

export default Messaging;
