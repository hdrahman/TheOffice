import { useState, useEffect } from 'react';
import '../css/Navbar.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo.jsx';
import DefaultPfp from '../assets/default-pfp.svg';

const ResponsiveAppBar = () => {
  const [activeItem, setActiveItem] = useState(null);
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
          <button onClick={handleLogout} className="navbar-item">Logout</button>
        ) : (
          <Link to='/login' className={`navbar-item ${activeItem === '/login' ? 'active' : ''}`}>Log In</Link>
        )}
        <div className="animation"></div>
      </nav>
      {/* floating profile picture — separate from the nav bar */}
      {user && (
        <div className="pfp-floating" onClick={() => navigate('/account')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') navigate('/account'); }}>
          <img src={user.profile_picture_url || DefaultPfp} alt="profile" />
        </div>
      )}
    </>
  );
}
export default ResponsiveAppBar;
