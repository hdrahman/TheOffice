import { React, useState, useEffect } from 'react';
import '../css/Navbar.css';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo.jsx';

const ResponsiveAppBar = () => {
  const [activeItem, setActiveItem] = useState(null);
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    setActiveItem(location.pathname)
  }, [location]);

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <Logo />
      <nav>
        <Link to='/' className={`navbar-item ${activeItem === '/' ? 'active' : ''}`}>Home</Link>
        <Link to='/schedule' className={`navbar-item ${activeItem === '/schedule' ? 'active' : ''}`}>Schedule</Link>
        <Link to='/messages' className={`navbar-item ${activeItem === '/messages' ? 'active' : ''}`}>Messages</Link>
        <Link to='/chatbot' className={`navbar-item ${activeItem === '/chatbot' ? 'active' : ''}`}>Chatbot</Link>
        {user ? (
          <button onClick={handleLogout} className="navbar-item">
            Logout ({user.username || user.email})
          </button>
        ) : (
          <Link to='/login' className={`navbar-item ${activeItem === '/login' ? 'active' : ''}`}>Log In</Link>
        )}
        <div className="animation"></div>
      </nav>
    </>
  );
}
export default ResponsiveAppBar;
