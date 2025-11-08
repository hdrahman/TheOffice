import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Checkbox, List, ListItem, ListItemText } from '@mui/material';
import { AiOutlinePlus } from 'react-icons/ai';

const AnnouncementPopup = () => {
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [isUserSelectOpen, setIsUserSelectOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [message, setMessage] = useState('');

  const defaultAnnouncements = [
    {
      title: "System Maintenance",
      date: "2023-11-01",
      content: "The system will undergo scheduled maintenance on Friday at 2 AM. Please save your work."
    },
    {
      title: "New Feature Release",
      date: "2023-11-05",
      content: "We’re excited to announce a new feature that will enhance your experience. Stay tuned!"
    },
    {
      title: "Holiday Notice",
      date: "2023-11-20",
      content: "Our office will be closed for the Thanksgiving holiday. Normal hours resume Monday."
    }
  ];

  useEffect(() => {
    const fetchUsersFromConversations = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/conversations');
        if (!response.ok) throw new Error('Failed to fetch conversations');

        const conversations = await response.json();
        const users = new Set();

        conversations.forEach(conversation => {
          conversation.participants.forEach(participant => {
            if (participant !== "Kalmani") users.add(participant);
          });
        });

        setAvailableUsers(Array.from(users));
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsersFromConversations();
  }, []);

  const toggleAnnouncementPopup = () => {
    setIsAnnouncementOpen(!isAnnouncementOpen);
  };

  const toggleUserSelectPopup = () => {
    setIsUserSelectOpen(!isUserSelectOpen);
  };

  const handleUserSelect = (user) => {
    setSelectedUsers((prevSelected) =>
      prevSelected.includes(user)
        ? prevSelected.filter((u) => u !== user)
        : [...prevSelected, user]
    );
  };

  const handleSendMessage = () => {
    console.log("Message sent to:", selectedUsers, "Content:", message);
    setMessage('');
    setSelectedUsers([]);
    setIsUserSelectOpen(false);
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg overflow-hidden w-80">
      {!isAnnouncementOpen && (
        <div
          onClick={toggleAnnouncementPopup}
          className="cursor-pointer bg-white text-black text-center py-2 rounded-lg shadow-lg hover:bg-gray-300 hover:text-black transition duration-200"
        >
          Announcements
        </div>
      )}

      {isAnnouncementOpen && (
        <div className="relative p-3 space-y-3 overflow-y-auto h-72 w-full">
          <div className="sticky top-0 bg-white z-10 p-2 border-b flex justify-between items-center">
            <div className="font-bold text-gray-700">Announcements</div>
            <button onClick={toggleAnnouncementPopup} className="text-gray-500 hover:text-gray-800">
              ✕
            </button>
          </div>
          {defaultAnnouncements.map((announcement, index) => (
            <div key={index} className="p-2 rounded-lg border-b border-gray-100">
              <div className="font-medium text-gray-800">{announcement.title}</div>
              <div className="text-xs text-gray-500">{announcement.date}</div>
              <div className="text-sm text-gray-700 mt-1">{announcement.content}</div>
            </div>
          ))}

          {/* Fixed message bar positioned at the bottom */}
          <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-md p-2 w-72">
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:border-gray-300"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                onClick={toggleUserSelectPopup}
                className="ml-2 p-2 text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-700 transition duration-200"
              >
                <AiOutlinePlus size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Select Popup */}
      <Dialog open={isUserSelectOpen} onClose={toggleUserSelectPopup} maxWidth="xs">
        <DialogTitle>Select Users</DialogTitle>
        <DialogContent style={{ height: '250px', width: '300px', overflowY: 'auto' }}>
          <List>
            {availableUsers.map((user) => (
              <ListItem key={user} button onClick={() => handleUserSelect(user)}>
                <Checkbox checked={selectedUsers.includes(user)} />
                <ListItemText primary={user} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={toggleUserSelectPopup} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleSendMessage}
            color="primary"
            disabled={selectedUsers.length === 0 || message.trim() === ''}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AnnouncementPopup;
