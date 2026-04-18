import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { LogOut, MapPin, AlertTriangle, Zap } from 'lucide-react';

const DashboardDEO = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' 
        : 'bg-gradient-to-br from-indigo-500 to-blue-600'
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
            DEO Dashboard
          </h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Welcome, {user?.name}!
          </p>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* District Overview Card */}
            <div className={`p-6 rounded-lg border-2 transition hover:shadow-lg cursor-pointer ${
              isDark
                ? 'bg-gray-700 border-indigo-500 hover:border-indigo-400'
                : 'bg-indigo-50 border-indigo-200 hover:border-indigo-400'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <MapPin className={isDark ? 'text-indigo-400' : 'text-indigo-600'} size={24} />
                <h3 className={`text-lg font-semibold ${isDark ? 'text-indigo-300' : 'text-indigo-900'}`}>
                  District Overview
                </h3>
              </div>
              <p className={isDark ? 'text-gray-400' : 'text-indigo-700'}>
                All schools risk assessment
              </p>
            </div>

            {/* Critical Issues Card */}
            <div className={`p-6 rounded-lg border-2 transition hover:shadow-lg cursor-pointer ${
              isDark
                ? 'bg-gray-700 border-red-500 hover:border-red-400'
                : 'bg-red-50 border-red-200 hover:border-red-400'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className={isDark ? 'text-red-400' : 'text-red-600'} size={24} />
                <h3 className={`text-lg font-semibold ${isDark ? 'text-red-300' : 'text-red-900'}`}>
                  Critical Issues
                </h3>
              </div>
              <p className={isDark ? 'text-gray-400' : 'text-red-700'}>
                Priority maintenance queue
              </p>
            </div>

            {/* Resource Allocation Card */}
            <div className={`p-6 rounded-lg border-2 transition hover:shadow-lg cursor-pointer ${
              isDark
                ? 'bg-gray-700 border-yellow-500 hover:border-yellow-400'
                : 'bg-yellow-50 border-yellow-200 hover:border-yellow-400'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <Zap className={isDark ? 'text-yellow-400' : 'text-yellow-600'} size={24} />
                <h3 className={`text-lg font-semibold ${isDark ? 'text-yellow-300' : 'text-yellow-900'}`}>
                  Resource Allocation
                </h3>
              </div>
              <p className={isDark ? 'text-gray-400' : 'text-yellow-700'}>
                Manage contractors
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardDEO;
