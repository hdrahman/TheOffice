import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home.jsx';
import Schedule from './pages/Schedule.jsx';
import Messages from './pages/Messages.jsx';
import LogIn from './pages/LogInPage.jsx';
import Chatbot from './pages/Chatbot.jsx';
import Profile from './pages/Profile.jsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path='/' element={<Home />}></Route>
          <Route path='/schedule' element={<Schedule />}></Route>
          <Route path='/messages' element={<Messages />}></Route>
          <Route path='/chatbot' element={<Chatbot />}></Route>
          <Route path='/login' element={<LogIn />}></Route>
          <Route path='/account' element={<Profile />}></Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App;
