import ReceiptForm from '@/components/ReceiptForm';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Rockman Logistics
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Register
              </Link>
              <Link
                href="/dashboard"
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Logistics Management System
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Manage shipments, receipts, and inventory with ease
            </p>
          </div>

          {/* Demo Accounts Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-blue-900 mb-3">Demo Accounts</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-3 rounded border border-blue-200">
                <p className="font-medium text-blue-900">Admin</p>
                <p className="text-gray-600">admin / admin123</p>
              </div>
              <div className="bg-white p-3 rounded border border-blue-200">
                <p className="font-medium text-blue-900">Manager</p>
                <p className="text-gray-600">manager / manager123</p>
              </div>
              <div className="bg-white p-3 rounded border border-blue-200">
                <p className="font-medium text-blue-900">Operator</p>
                <p className="text-gray-600">operator / operator123</p>
              </div>
            </div>
          </div>

          {/* Receipt Form Section */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Create New Receipt
              </h3>
              <ReceiptForm />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
