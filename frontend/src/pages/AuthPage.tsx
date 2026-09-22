import React, { useState } from 'react';
import { api } from '../services/api';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const response = await api.post('/api/auth/login', { username: email, password }, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        localStorage.setItem('token', response.data.access_token);
        setMessage('Logged in successfully!');
      } else {
        await api.post('/api/auth/register', { email, password });
        setMessage('Registered successfully! Please log in.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setMessage('Error: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="min-h-screen bg-viq-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-viq-surface p-8 rounded-xl border border-viq-divider shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-viq-text">
            {isLogin ? 'Sign in to VehicleIQ' : 'Create an account'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-viq-divider placeholder-viq-text-muted text-viq-text bg-viq-surface-container rounded-t-md focus:outline-none focus:ring-viq-primary focus:border-viq-primary sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-viq-divider placeholder-viq-text-muted text-viq-text bg-viq-surface-container rounded-b-md focus:outline-none focus:ring-viq-primary focus:border-viq-primary sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-viq-primary hover:bg-viq-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-viq-primary"
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </form>
        
        {message && <p className="mt-2 text-center text-sm text-viq-primary">{message}</p>}

        <div className="text-center mt-4">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-viq-text-muted hover:text-viq-text transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
