import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function LogIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-transparent flex items-center justify-center" style={{ height: '680px' }}>
      <div className="flex items-center justify-center w-full max-w-3xl">
        <div className="flex bg-white rounded-2xl shadow-xl overflow-hidden w-full border border-border">
          {/* Left Panel - Login Form */}
          <div className="w-1/2 p-8">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Log In</h2>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-semibold text-text-primary">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-2 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-focus focus:border-transparent bg-surface"
                  placeholder="you@office.io"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-semibold text-text-primary">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-2 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-focus focus:border-transparent bg-surface"
                  placeholder="password123"
                  required
                />
              </div>
              <div className="mb-2 text-xs text-text-secondary">
                Demo: alice@office.io / password123
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-hover transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>
          </div>

          {/* Right Panel - Sign Up Prompt */}
          <div className="w-1/2 bg-gradient-to-br from-brown-tint to-background flex flex-col items-center justify-center text-text-primary p-8">
            <h2 className="text-2xl font-bold mb-4">Welcome to login</h2>
            <p className="mb-4 text-text-secondary">Don&apos;t have an account?</p>
            <a href="#" className="bg-white text-primary font-semibold py-2 px-6 rounded-lg hover:bg-primary-tint transition duration-200 shadow-md border border-border">Sign Up</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LogIn;