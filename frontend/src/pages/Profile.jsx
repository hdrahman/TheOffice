import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../lib/api';
import '../css/Profile.css';
import DefaultPfp from '../assets/default-pfp.svg';

const Profile = () => {
    const { user, updateProfile, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        conversations: 0,
        upcoming_events: 0,
        messages_sent: 0
    });

    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        bio: '',
        status: 'online',
        profile_picture_url: null
    });

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                if (user) {
                    setFormData({
                        username: user.username || '',
                        full_name: user.full_name || '',
                        bio: user.bio || '',
                        status: user.status || 'online',
                        profile_picture_url: user.profile_picture_url || null
                    });

                    // Load user stats
                    const userStats = await api.getUserStats(user.id);
                    setStats(userStats);
                }
            } catch (err) {
                console.error('Error loading profile:', err);
                setError('Failed to load profile data');
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            await updateProfile(formData);
            setIsEditing(false);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        // Reset form to current user data
        if (user) {
            setFormData({
                username: user.username || '',
                full_name: user.full_name || '',
                bio: user.bio || '',
                status: user.status || 'online',
                profile_picture_url: user.profile_picture_url || null
            });
        }
        setIsEditing(false);
        setError(null);
    };

    const handleProfilePictureChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB');
            return;
        }

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setError('Invalid file type. Please upload PNG, JPG, GIF, or WebP');
            return;
        }

        try {
            setUploading(true);
            setError(null);
            const response = await api.uploadProfilePicture(file);

            // Update local state
            setFormData(prev => ({
                ...prev,
                profile_picture_url: response.profile_picture_url
            }));

            // Update context
            await updateProfile({ profile_picture_url: response.profile_picture_url });

        } catch (err) {
            console.error('Error uploading profile picture:', err);
            setError('Failed to upload profile picture. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="profile-container">
                    <div className="profile-card loading">
                        <p>Loading profile...</p>
                    </div>
                </div>
            </>
        );
    }

    if (!user) {
        return (
            <>
                <Navbar />
                <div className="profile-container">
                    <div className="profile-card">
                        <p className="error-message">Please log in to view your profile.</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="profile-container">
                <div className="profile-card">
                    {/* Header Section */}
                    <div className="profile-header">
                        <div className="profile-avatar-large">
                            <img src={formData.profile_picture_url || user.profile_picture_url || DefaultPfp} alt="Profile" />
                            <div className={`status-indicator status-${formData.status}`}></div>
                            {isEditing && (
                                <label className="avatar-upload-button" title="Upload profile picture">
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                                        onChange={handleProfilePictureChange}
                                        style={{ display: 'none' }}
                                    />
                                    <span className="camera-icon">📷</span>
                                </label>
                            )}
                        </div>

                        {!isEditing ? (
                            <div className="profile-info">
                                <h1 className="profile-name">{user.full_name || 'No name set'}</h1>
                                <p className="profile-username">@{user.username}</p>
                                <p className="profile-email">{user.email}</p>
                            </div>
                        ) : (
                            <div className="profile-info editing">
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleInputChange}
                                    placeholder="Full Name"
                                    className="profile-input"
                                    maxLength={100}
                                />
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    placeholder="Username"
                                    className="profile-input"
                                    maxLength={50}
                                />
                            </div>
                        )}
                    </div>

                    {/* Bio Section */}
                    <div className="profile-section">
                        <h2 className="section-title">About</h2>
                        {!isEditing ? (
                            <p className="profile-bio">{user.bio || 'No bio yet. Tell us about yourself!'}</p>
                        ) : (
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                                placeholder="Write a short bio..."
                                className="profile-textarea"
                                rows={4}
                                maxLength={500}
                            />
                        )}
                    </div>

                    {/* Status Section */}
                    {isEditing && (
                        <div className="profile-section">
                            <h2 className="section-title">Status</h2>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="profile-select"
                            >
                                <option value="online">🟢 Online</option>
                                <option value="away">🟡 Away</option>
                                <option value="busy">🔴 Busy</option>
                                <option value="offline">⚫ Offline</option>
                            </select>
                        </div>
                    )}

                    {/* Stats Section */}
                    <div className="profile-section">
                        <h2 className="section-title">Statistics</h2>
                        <div className="profile-stats">
                            <div className="stat-item">
                                <span className="stat-value">{stats.conversations}</span>
                                <span className="stat-label">Conversations</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{stats.upcoming_events}</span>
                                <span className="stat-label">Upcoming Events</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{stats.messages_sent}</span>
                                <span className="stat-label">Messages Sent</span>
                            </div>
                        </div>
                    </div>

                    {/* Member Since */}
                    <div className="profile-section">
                        <h2 className="section-title">Member Since</h2>
                        <p className="profile-date">{formatDate(user.created_at)}</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="error-banner">
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="profile-actions">
                        {!isEditing ? (
                            <>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setIsEditing(true)}
                                >
                                    Edit Profile
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={logout}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleCancel}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Profile;
