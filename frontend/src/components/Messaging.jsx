import React, { useState } from 'react';
import ConversationList from '../functions/ConversationList';
import MainChatPanel from './MainChatPanel';

function Messaging() {
  const [selectedConversationId, setSelectedConversationId] = useState(null);

  return (
    <div className=" bg-linear-gradient flex items-center justify-center p-2" style={{height: '680px'}}>
      <div className="bg-white border border-gray-200 rounded-lg h-full w-full max-w-7xl px-1 py-4 flex">
        {/* Sidebar for Conversation List */}
        <div className="bg-white border-r border-gray-200 h-full w-2/5 pr-1">
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
    </div>
  );
}

export default Messaging;