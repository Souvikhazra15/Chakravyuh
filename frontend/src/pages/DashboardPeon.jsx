import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { LogOut, FileText, CheckCircle, Upload, File } from 'lucide-react';

const DashboardPeon = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  const [formData, setFormData] = useState({
    category: '',
    condition: '',
    notes: ''
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const categories = ['Plumbing', 'Electrical', 'Structural', 'Classroom', 'Toilet'];
  const conditions = ['Good', 'Minor Issue', 'Major Issue'];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['text/csv', 'application/pdf'];
      if (validTypes.includes(file.type)) {
        setUploadedFile(file);
      } else {
        alert('Please upload a CSV or PDF file');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const submissionPayload = {
        school_id: user?.school_id || 1,
        category: formData.category,
        condition: formData.condition,
        submitted_by: user?.name || user?.email || 'peon'
      };

      const submissionResponse = await fetch(`${API_BASE}/api/v1/principal/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(submissionPayload)
      });

      if (!submissionResponse.ok) {
        throw new Error('Failed to submit for principal review');
      }

      const reportResponse = await fetch(`${API_BASE}/api/v1/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          school_id: user?.school_id || 1,
          category: formData.category,
          condition: formData.condition,
          file_name: uploadedFile?.name
        })
      });

      if (reportResponse.ok) {
        setSubmitted(true);
        setFormData({ category: '', condition: '', notes: '' });
        setUploadedFile(null);
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

            {/* File Upload Section */}
            <div className={`p-6 rounded-lg border-2 border-dashed transition ${
              isDark
                ? 'border-gray-600 bg-gray-700/50'
                : 'border-gray-300 bg-blue-50'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <Upload className={isDark ? 'text-blue-400' : 'text-blue-600'} size={24} />
                <label className={`block text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Upload Document
                </label>
              </div>
              <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Supported formats: CSV, PDF
              </p>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".csv,.pdf"
                className={`w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:border-blue-500 transition ${
                  isDark
                    ? 'bg-gray-600 border-gray-500 text-white file:bg-blue-600 file:text-white file:border-0 file:px-4 file:py-1 file:rounded file:cursor-pointer'
                    : 'bg-white border-gray-300 text-gray-900 file:bg-blue-500 file:text-white file:border-0 file:px-4 file:py-1 file:rounded file:cursor-pointer'
                }`}
              />
              {uploadedFile && (
                <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${
                  isDark ? 'bg-green-900/30 border border-green-700' : 'bg-green-100 border border-green-300'
                }`}>
                  <File className={isDark ? 'text-green-400' : 'text-green-600'} size={20} />
                  <span className={isDark ? 'text-green-200' : 'text-green-700'}>
                    {uploadedFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className={`ml-auto text-xs px-2 py-1 rounded transition ${
                      isDark
                        ? 'bg-red-900 text-red-200 hover:bg-red-800'
                        : 'bg-red-200 text-red-700 hover:bg-red-300'
                    }`}
                  >
                    Remove
                  </button>
                </div>
              )}
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
