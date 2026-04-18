import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { LogOut, BarChart3, ClipboardList, Archive } from 'lucide-react';

const DashboardPrincipal = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' 
        : 'bg-gradient-to-br from-purple-500 to-pink-600'
    }`}>
      {/* Navbar */}
      <nav className={`${isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-white'} shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Chakravyuh
          </h1>
          <div className="flex items-center gap-4">
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{user?.name}</span>
            <ThemeToggle />
            <button
              onClick={logout}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                isDark
                  ? 'bg-red-900 text-red-100 hover:bg-red-800'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className={`rounded-lg shadow-lg p-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Principal Dashboard
          </h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Welcome, {user?.name}!
          </p>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* School Overview Card */}
            <div className={`p-6 rounded-lg border-2 transition hover:shadow-lg cursor-pointer ${
              isDark
                ? 'bg-gray-700 border-purple-500 hover:border-purple-400'
                : 'bg-purple-50 border-purple-200 hover:border-purple-400'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <BarChart3 className={isDark ? 'text-purple-400' : 'text-purple-600'} size={24} />
                <h3 className={`text-lg font-semibold ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>
                  School Overview
                </h3>
              </div>
              <p className={isDark ? 'text-gray-400' : 'text-purple-700'}>
                View facility risk assessment
              </p>
            </div>

            {/* Maintenance Queue Card */}
            <div className={`p-6 rounded-lg border-2 transition hover:shadow-lg cursor-pointer ${
              isDark
                ? 'bg-gray-700 border-blue-500 hover:border-blue-400'
                : 'bg-blue-50 border-blue-200 hover:border-blue-400'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <ClipboardList className={isDark ? 'text-blue-400' : 'text-blue-600'} size={24} />
                <h3 className={`text-lg font-semibold ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
                  Maintenance Queue
                </h3>
              </div>
              <p className={isDark ? 'text-gray-400' : 'text-blue-700'}>
                Prioritized work orders
              </p>
            </div>

            {/* Repair History Card */}
            <div className={`p-6 rounded-lg border-2 transition hover:shadow-lg cursor-pointer ${
              isDark
                ? 'bg-gray-700 border-green-500 hover:border-green-400'
                : 'bg-green-50 border-green-200 hover:border-green-400'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <Archive className={isDark ? 'text-green-400' : 'text-green-600'} size={24} />
                <h3 className={`text-lg font-semibold ${isDark ? 'text-green-300' : 'text-green-900'}`}>
                  Repair History
                </h3>
              </div>
              <p className={isDark ? 'text-gray-400' : 'text-green-700'}>
                View completed repairs
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPrincipal;
