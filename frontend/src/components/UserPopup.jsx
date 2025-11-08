// src/components/UserPopup.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

function UserPopup({ name, summary, onClose }) {
  const navigate = useNavigate();

  const handleMessageClick = () => {
    navigate('/messages');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
      <div className="bg-surface rounded-2xl shadow-2xl w-11/12 max-w-lg p-6 relative border border-border">
        <h2 className="text-2xl font-bold text-center mb-4 text-text-primary">{name}</h2>
        <p className="text-text-secondary text-center mb-6">{summary}</p>
        <div className="flex flex-col gap-4">
          <button
            className="bg-primary text-white py-2 rounded-lg hover:bg-primary-hover transition duration-200 font-medium"
            onClick={handleMessageClick}
          >
            Message me
          </button>
          <button
            className="bg-text-secondary text-white py-2 rounded-lg hover:bg-text-primary transition duration-200 font-medium"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserPopup;