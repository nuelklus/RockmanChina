'use client';

import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

interface LoginData {
  username: string;
  password: string;
}

interface StaffUser {
  id: number;
  user: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  phone: string;
  employee_id: string;
  is_active_staff: boolean;
}

const StaffLogin: React.FC = () => {
  const [formData, setFormData] = useState<LoginData>({
    username: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<StaffUser | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First, authenticate with Django
      const authResponse = await axios.post(`${API_BASE_URL}/auth/login/`, formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (authResponse.status === 200) {
        // Store authentication token
        const token = authResponse.data.token;
        localStorage.setItem('authToken', token);
        
        // Get staff user details
        const staffResponse = await axios.get(`${API_BASE_URL}/staff/`, {
          headers: {
            'Authorization': `Token ${token}`,
          },
        });

        // Find the logged-in user from staff list
        const loggedInStaff = staffResponse.data.results.find(
          (staff: StaffUser) => staff.username === formData.username
        );

        if (loggedInStaff) {
          setUser(loggedInStaff);
          localStorage.setItem('staffUser', JSON.stringify(loggedInStaff));
          
          // Redirect to dashboard
          window.location.href = '/dashboard';
        }
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Invalid username or password');
      } else if (err.response?.status === 403) {
        setError('Account is not active or you do not have staff privileges');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('staffUser');
    setUser(null);
  };

  // Check if user is already logged in
  React.useEffect(() => {
    const storedUser = localStorage.getItem('staffUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome back, {user.first_name}!
              </h2>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Role:</span> {user.role}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Department:</span> {user.department || 'Not specified'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Employee ID:</span> {user.employee_id || 'Not specified'}
                </p>
              </div>
              
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Dashboard
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Staff Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Rockman Logistics Staff Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New staff member?</span>
              </div>
            </div>

            <div className="mt-6">
              <a
                href="/register"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Register New Account
              </a>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Demo Accounts:<br />
              Admin: admin / admin123<br />
              Manager: manager / manager123<br />
              Operator: operator / operator123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
