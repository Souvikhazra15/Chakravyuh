import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { LogOut, MapPin, AlertTriangle, Zap, Clock } from 'lucide-react';

const DashboardDEO = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('priority');

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/v1/deo/queue', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setQueue(data.queue || []);
      } catch (error) {
        console.error('Error fetching queue:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, []);

  const getPriorityBgColor = (level) => {
    switch(level) {
      case 'Critical': return isDark ? 'bg-red-900' : 'bg-red-50';
      case 'High': return isDark ? 'bg-yellow-900' : 'bg-yellow-50';
      case 'Medium': return isDark ? 'bg-blue-900' : 'bg-blue-50';
      case 'Low': return isDark ? 'bg-green-900' : 'bg-green-50';
      default: return isDark ? 'bg-gray-800' : 'bg-white';
    }
  };

  const getPriorityBorderColor = (level) => {
    switch(level) {
      case 'Critical': return 'border-l-4 border-red-500';
      case 'High': return 'border-l-4 border-yellow-500';
      case 'Medium': return 'border-l-4 border-blue-500';
      case 'Low': return 'border-l-4 border-green-500';
      default: return 'border-l-4 border-gray-500';
    }
  };

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
            Chakravyuh - DEO Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>District: {user?.name}</span>
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
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className={`p-4 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Issues</p>
            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{queue.length}</p>
          </div>
          <div className={`p-4 rounded-lg shadow-lg ${isDark ? 'bg-red-900' : 'bg-red-50'}`}>
            <p className={`text-sm ${isDark ? 'text-red-200' : 'text-red-700'}`}>Critical</p>
            <p className={`text-3xl font-bold ${isDark ? 'text-red-300' : 'text-red-700'}`}>
              {queue.filter(q => q.priority_level === 'Critical').length}
            </p>
          </div>
          <div className={`p-4 rounded-lg shadow-lg ${isDark ? 'bg-yellow-900' : 'bg-yellow-50'}`}>
            <p className={`text-sm ${isDark ? 'text-yellow-200' : 'text-yellow-700'}`}>High Priority</p>
            <p className={`text-3xl font-bold ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
              {queue.filter(q => q.priority_level === 'High').length}
            </p>
          </div>
          <div className={`p-4 rounded-lg shadow-lg ${isDark ? 'bg-blue-900' : 'bg-blue-50'}`}>
            <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>Pending</p>
            <p className={`text-3xl font-bold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              {queue.filter(q => q.status !== 'Resolved').length}
            </p>
          </div>
        </div>

        {/* Main Table */}
        <div className={`rounded-lg shadow-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              District Maintenance Priority Queue
            </h2>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="priority">Sort by Priority</option>
              <option value="school">Sort by School</option>
              <option value="days">Sort by Days to Failure</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Clock className={`animate-spin ${isDark ? 'text-gray-400' : 'text-gray-500'}`} size={40} />
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {queue.length === 0 ? (
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No issues in queue</p>
              ) : (
                queue.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg ${getPriorityBgColor(item.priority_level)} ${getPriorityBorderColor(item.priority_level)} transition hover:shadow-lg`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>School ID</p>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {item.school_id}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Category</p>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {item.category}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Priority Score</p>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {item.priority_score?.toFixed(2) || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Days to Failure</p>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {item.days_to_failure || 30}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Priority Level</p>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          item.priority_level === 'Critical' ? 'bg-red-500 text-white' :
                          item.priority_level === 'High' ? 'bg-yellow-500 text-black' :
                          item.priority_level === 'Medium' ? 'bg-blue-500 text-white' :
                          'bg-green-500 text-white'
                        }`}>
                          {item.priority_level}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button className={`px-3 py-1 rounded text-sm font-semibold transition ${
                          isDark
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}>
                          Assign
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardDEO;
