import React from 'react';

const ChatPanel = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
        <div>
          <div className="font-medium text-gray-800">Person 1</div>
          <div className="text-sm text-gray-500">Online</div>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
        <div className="text-center text-gray-400">No messages yet</div>
      </div>
      <div className="p-4 border-t border-gray-200 flex items-center space-x-2">
        <input
          type="text"
          placeholder="Write a message..."
          className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
