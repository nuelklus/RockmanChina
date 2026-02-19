'use client';

import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

interface StaffRegisterData {
  user: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
  };
  staff: {
    role: string;
    department: string;
    phone: string;
  };
}

const StaffRegister: React.FC = () => {
  const [formData, setFormData] = useState<StaffRegisterData>({
    user: {
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      password: '',
    },
    staff: {
      role: 'operator',
      department: '',
      phone: '',
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const roleOptions = [
    { value: 'admin', label: 'Administrator' },
    { value: 'manager', label: 'Manager' },
    { value: 'operator', label: 'Operator' },
    { value: 'clerk', label: 'Clerk' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('user_')) {
      setFormData(prev => ({
        ...prev,
        user: {
          ...prev.user,
          [name.substring(5)]: value,
        },
      }));
    } else if (name.startsWith('staff_')) {
      setFormData(prev => ({
        ...prev,
        staff: {
          ...prev.staff,
          [name.substring(6)]: value,
        },
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API_BASE_URL}/staff/create_staff/`, formData);
      
      if (response.status === 201) {
        setSuccess('Staff user created successfully! You can now login.');
        setFormData({
          user: {
            username: '',
            email: '',
            first_name: '',
            last_name: '',
            password: '',
          },
          staff: {
            role: 'operator',
            department: '',
            phone: '',
            employee_id: '',
          },
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Register Staff User
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* User Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">User Information</h3>
              
              <div>
                <label htmlFor="user_username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="user_username"
                  name="user_username"
                  type="text"
                  required
                  value={formData.user.username}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="user_email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="user_email"
                  name="user_email"
                  type="email"
                  required
                  value={formData.user.email}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="user_first_name" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    id="user_first_name"
                    name="user_first_name"
                    type="text"
                    required
                    value={formData.user.first_name}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="user_last_name" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    id="user_last_name"
                    name="user_last_name"
                    type="text"
                    required
                    value={formData.user.last_name}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="user_password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="user_password"
                  name="user_password"
                  type="password"
                  required
                  value={formData.user.password}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Staff Information */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Staff Information</h3>
              
              <div>
                <label htmlFor="staff_role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="staff_role"
                  name="staff_role"
                  value={formData.staff.role}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                >
                  {roleOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="staff_department" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <input
                  id="staff_department"
                  name="staff_department"
                  type="text"
                  value={formData.staff.department}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="staff_phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  id="staff_phone"
                  name="staff_phone"
                  type="tel"
                  value={formData.staff.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                />
              </div>

            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Register Staff User'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <a
                href="/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign In
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffRegister;
