import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { LogOut, FileText, CheckCircle, Upload, File, AlertTriangle, Camera, Clock, Check, X, Droplet, Zap, Home } from 'lucide-react';

const DashboardPeon = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  
  const [formData, setFormData] = useState({
    category: '',
    condition: '',
    notes: '',
    is_urgent: false
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  const categories = ['Plumbing', 'Electrical', 'Structural', 'Classroom', 'Toilet'];
  const conditions = ['Good', 'Minor Issue', 'Major Issue'];

  const checklistItems = [
    { id: 'toilets', icon: '🚽', label: 'Toilets Condition', description: 'Check functionality & cleanliness' },
    { id: 'water', icon: '💧', label: 'Water Supply', description: 'Check water flow & pressure' },
    { id: 'electrical', icon: '⚡', label: 'Electrical Fittings', description: 'Check switches & wiring' },
    { id: 'structural', icon: '🏗️', label: 'Structural Safety', description: 'Check walls & roof' }
  ];

  const [checklistStatus, setChecklistStatus] = useState({
    toilets: false,
    water: false,
    electrical: false,
    structural: false
  });

  // Auto-set condition to Major Issue if urgent is checked
  useEffect(() => {
    if (formData.is_urgent) {
      setFormData(prev => ({ ...prev, condition: 'Major Issue' }));
    }
  }, [formData.is_urgent]);

  // Fetch submissions on mount
  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setSubmissionsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/principal/submissions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const userSubmissions = (data.submissions || data || []).filter(
          sub => sub.submitted_by === (user?.name || user?.email || 'peon')
        );
        setSubmissions(userSubmissions);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'text/csv', 'application/pdf'];
      if (validTypes.includes(file.type)) {
        setUploadedFile(file);
        
        // Show preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setPhotoPreview(event.target.result);
          };
          reader.readAsDataURL(file);
        }
      } else {
        alert('Please upload a valid file (JPG, PNG, CSV, or PDF)');
      }
    }
  };

  const toggleChecklistItem = (id) => {
    setChecklistStatus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const submissionPayload = {
        school_id: user?.school_id || 1,
        category: formData.category,
        condition: formData.condition,
        submitted_by: user?.name || user?.email || 'peon',
        notes: formData.notes,
        is_urgent: formData.is_urgent
      };

      // First submit form data (main submission)
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

      // Then upload file if present (optional)
      if (uploadedFile) {
        try {
          const formDataObj = new FormData();
          formDataObj.append('school_id', String(user?.school_id || 1));
          formDataObj.append('category', String(formData.category));
          formDataObj.append('condition', String(formData.condition));
          formDataObj.append('submitted_by', String(user?.name || user?.email || 'peon'));
          formDataObj.append('notes', String(formData.notes || ''));
          formDataObj.append('file', uploadedFile);

          const fileResponse = await fetch(`${API_BASE}/api/v1/peon/submit-file`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: formDataObj
          });

          if (!fileResponse.ok) {
            console.warn('File upload skipped (optional)');
          }
        } catch (fileError) {
          console.warn('File upload optional:', fileError.message);
        }
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
          file_name: uploadedFile?.name,
          is_urgent: formData.is_urgent
        })
      });

      if (reportResponse.ok) {
        setSubmitted(true);
        setFormData({ category: '', condition: '', notes: '', is_urgent: false });
        setUploadedFile(null);
        setPhotoPreview(null);
        setChecklistStatus({ toilets: false, water: false, electrical: false, structural: false });
        await fetchSubmissions();
        
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Error submitting report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'verified': return isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800';
      case 'pending': return isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800';
      case 'rejected': return isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800';
      default: return isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'verified': return <Check size={16} className="text-green-500" />;
      case 'pending': return <Clock size={16} className="text-yellow-500" />;
      case 'rejected': return <X size={16} className="text-red-500" />;
      default: return null;
    }
  };

  const checkedCount = Object.values(checklistStatus).filter(Boolean).length;
  const checklistProgress = Math.round((checkedCount / 4) * 100);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      {/* Navbar */}
      <nav className={`${isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-white shadow-md'} sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Home className={isDark ? 'text-blue-400' : 'text-blue-600'} size={28} />
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              School Maintenance
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{user?.name}</p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Peon / Watchman</p>
            </div>
            <ThemeToggle />
            <button
              onClick={logout}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-semibold ${
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
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        
        {/* Success Message */}
        {submitted && (
          <div className={`p-4 rounded-lg border-l-4 flex items-center gap-3 animate-pulse ${
            isDark 
              ? 'bg-green-900 border-green-500 text-green-200' 
              : 'bg-green-50 border-green-500 text-green-800'
          }`}>
            <CheckCircle size={24} />
            <div>
              <p className="font-bold">✅ Report Submitted Successfully!</p>
              <p className="text-sm">Principal will review and approve shortly.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Daily Checklist */}
            <div className={`rounded-lg shadow-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  📋 Daily Inspection Checklist
                </h2>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                  checklistProgress === 100 
                    ? 'bg-green-100 text-green-800' 
                    : isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                }`}>
                  {checklistProgress}% Complete
                </span>
              </div>

              {/* Progress Bar */}
              <div className={`w-full h-2 rounded-full mb-6 overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>

              {/* Checklist Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {checklistItems.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleChecklistItem(item.id)}
                    className={`p-4 rounded-lg border-2 transition text-left ${
                      checklistStatus[item.id]
                        ? isDark ? 'border-green-500 bg-green-900/20' : 'border-green-500 bg-green-50'
                        : isDark ? 'border-gray-700 bg-gray-900/50 hover:border-gray-600' : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`text-2xl flex-shrink-0 ${
                        checklistStatus[item.id] ? 'opacity-100' : 'opacity-50'
                      }`}>
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                            {item.label}
                          </p>
                          {checklistStatus[item.id] && (
                            <Check size={18} className="text-green-500" />
                          )}
                        </div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Inspection Form */}
            <div className={`rounded-lg shadow-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                <FileText size={24} />
                Weekly Facility Report
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Category - Large Buttons */}
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Issue Category *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat })}
                        className={`p-3 rounded-lg font-semibold transition border-2 text-sm ${
                          formData.category === cat
                            ? isDark ? 'border-blue-500 bg-blue-900 text-blue-100' : 'border-blue-500 bg-blue-100 text-blue-900'
                            : isDark ? 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-600' : 'border-gray-300 bg-gray-100 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Condition - Large Buttons */}
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Current Condition *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {conditions.map(cond => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => {
                          if (cond === 'Major Issue') {
                            setFormData({ ...formData, condition: cond, is_urgent: true });
                          } else {
                            setFormData({ ...formData, condition: cond });
                          }
                        }}
                        disabled={formData.is_urgent && cond !== 'Major Issue'}
                        className={`p-4 rounded-lg font-semibold transition border-2 ${
                          formData.condition === cond
                            ? cond === 'Major Issue'
                              ? isDark ? 'border-red-500 bg-red-900 text-red-100' : 'border-red-500 bg-red-100 text-red-900'
                              : cond === 'Minor Issue'
                              ? isDark ? 'border-yellow-500 bg-yellow-900 text-yellow-100' : 'border-yellow-500 bg-yellow-100 text-yellow-900'
                              : isDark ? 'border-green-500 bg-green-900 text-green-100' : 'border-green-500 bg-green-100 text-green-900'
                            : isDark ? 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-600 disabled:opacity-50' : 'border-gray-300 bg-gray-100 text-gray-700 hover:border-gray-400 disabled:opacity-50'
                        }`}
                      >
                        {cond === 'Good' && '✅'} {cond === 'Minor Issue' && '⚠️'} {cond === 'Major Issue' && '🚨'} {cond}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Urgent Toggle */}
                <div className={`p-4 rounded-lg border-2 ${
                  formData.is_urgent
                    ? isDark ? 'border-red-600 bg-red-900/30' : 'border-red-400 bg-red-50'
                    : isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-300 bg-gray-50'
                }`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_urgent}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        is_urgent: e.target.checked,
                        condition: e.target.checked ? 'Major Issue' : ''
                      })}
                      className="w-5 h-5"
                    />
                    <div>
                      <p className={`font-semibold flex items-center gap-2 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                        <AlertTriangle size={18} />
                        Mark as Urgent Issue
                      </p>
                      <p className={`text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                        Requires immediate attention
                      </p>
                    </div>
                  </label>
                </div>

                {/* Notes */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Notes ({formData.notes.length}/200)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value.slice(0, 200) })}
                    rows="3"
                    placeholder="Describe the issue, location, or additional details..."
                    className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-blue-500 transition text-sm ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>

                {/* File Upload */}
                <div className={`p-6 rounded-lg border-2 border-dashed transition ${
                  isDark
                    ? 'border-gray-600 bg-gray-900/50 hover:border-gray-500'
                    : 'border-blue-300 bg-blue-50 hover:border-blue-400'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <Camera className={isDark ? 'text-blue-400' : 'text-blue-600'} size={24} />
                    <label className={`block text-sm font-semibold cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Upload Photo or Document
                    </label>
                  </div>
                  <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    JPG, PNG (photo) or CSV, PDF (document)
                  </p>
                  
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,.csv,.pdf"
                    className={`w-full cursor-pointer px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-blue-500 transition text-sm ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white file:bg-blue-600 file:text-white file:border-0 file:px-3 file:py-1 file:rounded file:cursor-pointer'
                        : 'bg-white border-gray-300 text-gray-900 file:bg-blue-500 file:text-white file:border-0 file:px-3 file:py-1 file:rounded file:cursor-pointer'
                    }`}
                  />

                  {/* File Preview */}
                  {uploadedFile && (
                    <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
                      isDark ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-300'
                    }`}>
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <File className={isDark ? 'text-green-400' : 'text-green-600'} size={24} />
                      )}
                      <div className="flex-1">
                        <p className={`font-semibold text-sm ${isDark ? 'text-green-200' : 'text-green-800'}`}>
                          {uploadedFile.name}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFile(null);
                          setPhotoPreview(null);
                        }}
                        className={`text-xs px-3 py-2 rounded font-semibold transition ${
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

                {/* Submit Button - Large & Prominent */}
                <button
                  type="submit"
                  disabled={loading || !formData.category || !formData.condition}
                  className={`w-full py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2 ${
                    loading || !formData.category || !formData.condition
                      ? isDark ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : isDark
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin">⏳</div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      Submit Report
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Status Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Stats */}
            <div className={`rounded-lg shadow-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                📊 Your Submissions
              </h3>
              <div className="space-y-3">
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Submitted</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {submissions.length}
                  </p>
                </div>
                <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} pt-3`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Pending Approval</p>
                  <p className={`text-2xl font-bold text-yellow-500`}>
                    {submissions.filter(s => s.status === 'pending').length}
                  </p>
                </div>
                <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} pt-3`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Approved</p>
                  <p className={`text-2xl font-bold text-green-500`}>
                    {submissions.filter(s => s.status === 'verified').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Submissions */}
            <div className={`rounded-lg shadow-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                📝 Recent Submissions
              </h3>
              
              {submissionsLoading ? (
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</p>
              ) : submissions.length === 0 ? (
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  No submissions yet. Submit your first report above!
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {submissions.slice(0, 8).map((sub, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border-l-4 ${
                        sub.status === 'verified'
                          ? isDark ? 'border-green-500 bg-green-900/20' : 'border-green-500 bg-green-50'
                          : sub.status === 'pending'
                          ? isDark ? 'border-yellow-500 bg-yellow-900/20' : 'border-yellow-500 bg-yellow-50'
                          : isDark ? 'border-red-500 bg-red-900/20' : 'border-red-500 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {sub.category}
                        </p>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${getStatusColor(sub.status)}`}>
                          {getStatusIcon(sub.status)}
                          {sub.status?.charAt(0).toUpperCase() + sub.status?.slice(1) || 'Pending'}
                        </span>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {sub.condition}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {new Date(sub.date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Help Card */}
            <div className={`rounded-lg shadow-lg p-6 ${
              isDark ? 'bg-gradient-to-br from-blue-900 to-indigo-900' : 'bg-gradient-to-br from-blue-100 to-indigo-100'
            }`}>
              <h3 className={`font-bold mb-3 ${isDark ? 'text-blue-200' : 'text-blue-900'}`}>
                💡 Tips
              </h3>
              <ul className={`text-xs space-y-2 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                <li>✓ Complete daily checklist first</li>
                <li>✓ Select category before condition</li>
                <li>✓ Upload clear photos of issues</li>
                <li>✓ Use urgent for immediate needs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPeon;
