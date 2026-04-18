import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { LogOut, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const DashboardPeon = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    category: '',
    condition: '',
    notes: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const categories = ['Plumbing', 'Electrical', 'Structural', 'Classroom', 'Toilet'];
  const conditions = ['Good', 'Minor Issue', 'Major Issue'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/reports/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          school_id: user?.school_id,
          category: formData.category,
          condition: formData.condition,
          notes: formData.notes,
          submitted_by: user?.id
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ category: '', condition: '', notes: '' });
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' 
        : 'bg-gradient-to-br from-blue-500 to-purple-600'
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className={`rounded-lg shadow-lg p-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center gap-3 mb-6">
            <FileText className={`${isDark ? 'text-blue-400' : 'text-blue-600'}`} size={32} />
            <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Weekly Facility Report
            </h2>
          </div>

          {submitted && (
            <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 rounded flex items-center gap-3">
              <CheckCircle className="text-green-600" size={24} />
              <span className="text-green-800 font-semibold">Report submitted successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Issue Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-blue-500 transition ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Select category...</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Current Condition *
              </label>
              <select
                required
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-blue-500 transition ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Select condition...</option>
                {conditions.map(cond => (
                  <option key={cond} value={cond}>{cond}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="4"
                className={`w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-blue-500 transition ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Describe any issues or observations..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600'
                  : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-400'
              }`}
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DashboardPeon;
