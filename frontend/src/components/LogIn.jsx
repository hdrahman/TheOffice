import React, { useState } from 'react';
import Navbar from './Navbar';

function LogIn() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, rememberMe }),
    });

    if (response.ok) {
      console.log('User data saved successfully');
    } else {
      console.error('Failed to save user data');
    }
  };

  return (
    <div className="h-screen bg-transparent flex items-center justify-center" style={{ height: '680px' }}>
      <div className="flex items-center justify-center w-full max-w-3xl"> {/* Increased max width */}
        <div className="flex bg-white rounded-2xl shadow-lg overflow-hidden w-full"> {/* Set width to full */}
          {/* Left Panel - Login Form */}
          <div className="w-1/2 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Log In</h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700">Username</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full mt-2 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-2 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div className="flex items-center justify-between mb-6">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    className="form-checkbox text-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Remember Me</span>
                </label>
                <a href="#" className="text-sm text-purple-500 hover:underline">Forgot Password?</a>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-br from-purple-800 to-purple-500 text-white py-2 rounded-lg hover:bg-purple-800 transition duration-200"
              >
                Log In
              </button>
            </form>
          </div>

          {/* Right Panel - Sign Up Prompt */}
          <div className="w-1/2 bg-gradient-to-br from-purple-400 to-purple-800 flex flex-col items-center justify-center text-white p-8">
            <h2 className="text-2xl font-bold mb-4">Welcome to login</h2>
            <p className="mb-4">Don't have an account?</p>
            <a href="#" className="bg-white text-pink-500 font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition duration-200">Sign Up</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LogIn;