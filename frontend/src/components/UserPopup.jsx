// src/components/UserPopup.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import DefaultPfp from '../assets/default-pfp.svg';

function UserPopup({ name, summary, userId, onClose }) {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (userId) {
        try {
          setLoading(true);
          const [profile, stats] = await Promise.all([
            api.getUserProfile(userId),
            api.getUserStats(userId)
          ]);
          setUserProfile(profile);
          setUserStats(stats);
        } catch (error) {
          console.error('Error loading user data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId]);

  const handleMessageClick = () => {
    navigate('/messages');
  };

  const handleScheduleClick = () => {
    navigate('/schedule');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
      <div className="bg-surface rounded-2xl shadow-2xl w-11/12 max-w-lg p-6 relative border border-border">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-text-secondary">Loading profile...</p>
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <img
                  src={userProfile?.profile_picture_url || DefaultPfp}
                  alt={name}
                  className="w-20 h-20 rounded-full border-2 border-primary object-cover"
                />
                {userProfile?.status && (
                  <div
                    className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white
                      ${userProfile.status === 'online' ? 'bg-green-500' :
                        userProfile.status === 'away' ? 'bg-yellow-500' :
                          userProfile.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'}`}
                  />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-text-primary">{name}</h2>
                {userProfile?.username && (
                  <p className="text-primary font-medium">@{userProfile.username}</p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">About</h3>
              <p className="text-text-secondary">{summary || userProfile?.bio || 'No bio available'}</p>
            </div>

            {/* Stats */}
            {userStats && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Activity</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-100 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{userStats.conversations}</p>
                    <p className="text-xs text-text-secondary">Chats</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{userStats.upcoming_events}</p>
                    <p className="text-xs text-text-secondary">Events</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{userStats.messages_sent}</p>
                    <p className="text-xs text-text-secondary">Messages</p>
                  </div>
                </div>
              </div>
            )}

            {/* Member Since */}
            {userProfile?.created_at && (
              <div className="mb-6">
                <p className="text-sm text-text-secondary">
                  Member since {formatDate(userProfile.created_at)}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-hover transition duration-200 font-medium"
                onClick={handleMessageClick}
              >
                💬 Message
              </button>
              <button
                className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200 font-medium"
                onClick={handleScheduleClick}
              >
                📅 View Schedule
              </button>
              <button
                className="bg-text-secondary text-white py-2 px-4 rounded-lg hover:bg-text-primary transition duration-200 font-medium"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default UserPopup;