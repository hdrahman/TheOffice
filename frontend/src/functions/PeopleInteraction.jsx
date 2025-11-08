import React, { useState } from 'react';
import Avatar2 from '../components/3d/Avatar2';
import UserPopup from '../components/UserPopup';

function App() {
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState({ name: '', summary: '' });

  const handleClick = (name, summary) => {
    setPopupData({ name, summary });
    setShowPopup(true);
  };

  const handleClose = () => {
    setShowPopup(false);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <Avatar2
        name="John Doe"
        summary="John is currently working on a new React project to enhance frontend development skills."
        onAvatarClick={handleClick}
      />

      {/* Popup */}
      {showPopup && (
        <UserPopup
          name={popupData.name}
          summary={popupData.summary}
          onClose={handleClose}
        />
      )}
    </div>
  );
}

export default App;
