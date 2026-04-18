import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { LogOut, BarChart3, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const DashboardPrincipal = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({ total: 0, critical: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/v1/school/issues', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setIssues(data.issues || []);
        setStats({
          total: data.issues?.length || 0,
          critical: data.issues?.filter(i => i.priority_level === 'Critical').length || 0
        });
      } catch (error) {
        console.error('Error fetching issues:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPriorityColor = (level) => {
    switch(level) {
      case 'Critical': return isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800';
      case 'High': return isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800';
      case 'Medium': return isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800';
      case 'Low': return isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800';
      default: return isDark ? 'bg-gray-700' : 'bg-gray-100';
    }
  };

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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Issues */}
          <div className={`p-6 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Issues</p>
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{stats.total}</p>
              </div>
              <BarChart3 className={`${isDark ? 'text-purple-400' : 'text-purple-600'}`} size={40} />
            </div>
          </div>

          {/* Critical Issues */}
          <div className={`p-6 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Critical Issues</p>
                <p className={`text-3xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{stats.critical}</p>
              </div>
              <AlertTriangle className={`${isDark ? 'text-red-400' : 'text-red-600'}`} size={40} />
            </div>
          </div>

          {/* Completion Rate */}
          <div className={`p-6 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Resolved</p>
                <p className={`text-3xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>65%</p>
              </div>
              <CheckCircle className={`${isDark ? 'text-green-400' : 'text-green-600'}`} size={40} />
            </div>
          </div>
        </div>

        {/* Issues Table */}
        <div className={`rounded-lg shadow-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            School Issues & Maintenance Queue
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <Clock className={`animate-spin ${isDark ? 'text-gray-400' : 'text-gray-500'}`} size={32} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Category</th>
                    <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Condition</th>
                    <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Risk Score</th>
                    <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Priority</th>
                    <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Days to Failure</th>
                    <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue, idx) => (
                    <tr key={idx} className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{issue.category}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{issue.condition}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{(issue.risk_score || 0).toFixed(2)}</td>
                      <td className={`px-4 py-3`}>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(issue.priority_level)}`}>
                          {issue.priority_level}
                        </span>
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{issue.days_to_failure || 30}</td>
                      <td className={`px-4 py-3`}>
                        <button className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                          isDark
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}>
                          Approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPrincipal;
