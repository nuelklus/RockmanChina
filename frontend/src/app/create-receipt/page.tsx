'use client';

import React, { useState, useEffect } from 'react';
import ReceiptForm from '@/components/ReceiptForm';

const API_BASE_URL = 'https://rockmanchina.onrender.com';

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
  created_at: string;
  updated_at: string;
}

const CreateReceipt: React.FC = () => {
  const [user, setUser] = useState<StaffUser | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('staffUser');
    const token = localStorage.getItem('authToken');
    
    if (storedUser && token) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
    } else {
      window.location.href = '/login';
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('staffUser');
    window.location.href = '/login';
  };

  const handleReceiptCreated = () => {
    // Show success message and optionally redirect
    alert('Receipt created successfully!');
    // You could redirect to receipts list or dashboard
    // window.location.href = '/dashboard';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rockman Logistics</h1>
              <p className="text-gray-600">Create Receipt</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                <p className="text-sm text-gray-500">{user.username}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <a href="/dashboard" className="text-gray-500 hover:text-gray-700">
                  Dashboard
                </a>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <a href="/create-receipt" className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                    Create Receipt
                  </a>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Receipt Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900 mb-6">
              Create New Receipt
            </h2>
            <ReceiptForm onReceiptCreated={handleReceiptCreated} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateReceipt;
