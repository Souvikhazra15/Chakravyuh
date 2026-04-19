import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { LogOut, BarChart3, AlertTriangle, CheckCircle, Upload, Filter, Check, X, Clock3, Zap } from 'lucide-react';

const DashboardPrincipal = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  
  // API Base URL
  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  
  const [submissions, setSubmissions] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [csvPreview, setCsvPreview] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [analysisSummary, setAnalysisSummary] = useState(null);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [analysisText, setAnalysisText] = useState('');
  const [submittedFiles, setSubmittedFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        };

        // Use school_id from user context or default to 1
        const schoolId = user?.school_id || 1;

        const [submissionsRes, predictionsRes, workOrdersRes, filesRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/principal/submissions`, { headers }).catch(() => null),
          fetch(`${API_BASE}/api/v1/prediction?school_id=${schoolId}`, { headers }).catch(() => null),
          fetch(`${API_BASE}/api/v1/work-orders`, { headers }).catch(() => null),
          fetch(`${API_BASE}/api/v1/peon/submitted-files`, { headers }).catch(() => null),
        ]);

        if (submissionsRes?.ok) {
          const subData = await submissionsRes.json();
          setSubmissions(subData.submissions || subData || []);
        } else {
          setSubmissions([]);
        }

        if (predictionsRes?.ok) {
          const predData = await predictionsRes.json();
          const formattedPreds = (Array.isArray(predData) ? predData : predData.predictions || []).map((p, idx) => ({
            id: `PRED${String(idx + 1).padStart(3, '0')}`,
            category: p.category,
            issue: p.prediction,
            risk_score: p.risk_score,
            status: 'pending',
            confidence: Math.round(p.risk_score * 100)
          }));
          setPredictions(formattedPreds);
        } else {
          setPredictions([]);
        }

        if (workOrdersRes?.ok) {
          const woData = await workOrdersRes.json();
          const formattedWO = (Array.isArray(woData) ? woData : woData.workOrders || []).map(wo => ({
            id: `WO${String(wo.id).padStart(3, '0')}`,
            school_id: wo.school_id,
            category: wo.category,
            issue: wo.issue || 'Maintenance',
            priority_level: wo.priority_level || 'Medium',
            assigned_contractor: wo.assigned_contractor || wo.assigned_to || 'Unassigned',
            status: wo.status || 'Pending', after_photos: wo.after_photos, completion_notes: wo.completion_notes, feedback_notes: wo.feedback_notes, after_photos: wo.after_photos, completion_notes: wo.completion_notes, feedback_notes: wo.feedback_notes
          }));
          const schoolId = user?.school_id;
          setWorkOrders(schoolId ? formattedWO.filter(wo => wo.school_id === schoolId) : formattedWO);
        } else {
          setWorkOrders([]);
        }

        if (filesRes?.ok) {
          const filesData = await filesRes.json();
          setSubmittedFiles(filesData.files || []);
        } else {
          setSubmittedFiles([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setSubmissions([]);
        setPredictions([]);
        setWorkOrders([]);
        setSubmittedFiles([]);
      }
    };

    fetchData();
  }, [API_BASE, user]);

  const getPriorityColor = (level) => {
    switch(level) {
      case 'Critical': return isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800';
      case 'High': return isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800';
      case 'Medium': return isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800';
      case 'Low': return isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800';
      default: return isDark ? 'bg-gray-700' : 'bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'verified': return isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800';
      case 'pending': return isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800';
      case 'rejected': return isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800';
      default: return isDark ? 'bg-gray-700' : 'bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'verified': return <CheckCircle size={16} className="text-green-500" />;
      case 'pending': return <Clock3 size={16} className="text-yellow-500" />;
      case 'rejected': return <X size={16} className="text-red-500" />;
      default: return null;
    }
  };

  const handleApproveSubmission = async (id) => {
    try {
      await fetch(`${API_BASE}/api/v1/principal/approve/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      }).catch(() => null);

      setSubmissions(submissions.map(s => s.submission_id === id ? { ...s, status: 'verified' } : s));
    } catch (error) {
      console.error('Error approving submission:', error);
    }
  };

  const handleRejectSubmission = async (id) => {
    try {
      await fetch(`${API_BASE}/api/v1/principal/reject/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      }).catch(() => null);

      setSubmissions(submissions.map(s => s.submission_id === id ? { ...s, status: 'rejected' } : s));
    } catch (error) {
      console.error('Error rejecting submission:', error);
    }
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith('.csv')) {
      setUploadStatus('Please select a valid CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const rows = text.split('\n').filter(r => r.trim());
        
        if (rows.length < 2) {
          setUploadStatus('CSV must have header and at least 1 data row');
          return;
        }

        // Parse header
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
        
        // Parse data rows
        const parsedData = [];
        for (let i = 1; i < rows.length; i++) {
          const values = rows[i].split(',').map(v => v.trim());
          if (values.length > 0 && values[0]) {
            const record = {};
            headers.forEach((header, idx) => {
              record[header] = values[idx] || '';
            });
            parsedData.push(record);
          }
        }

        if (parsedData.length === 0) {
          setUploadStatus('No valid data rows found in CSV');
          return;
        }

        setCsvData(parsedData);
        
        // Show preview
        const preview = rows.slice(0, 4).map(row => row.split(','));
        setCsvPreview(preview);
        setUploadStatus(`✅ CSV loaded: ${parsedData.length} records ready for analysis`);
        
        // Reset analysis state for new upload
        setAnalysisCompleted(false);
        setPredictions([]);
        setAnalysisSummary(null);
      } catch (error) {
        setUploadStatus(`Error parsing CSV: ${error.message}`);
        setCsvData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleRunAnalysis = async () => {
    setAnalysisError(null);
    setAnalysisMessage(null);

    if (!csvData || csvData.length === 0) {
      setAnalysisError('Please upload a CSV file first');
      return;
    }

    setAnalyzing(true);
    setAnalysisMessage('🔄 Analyzing real data...');

    try {
      const schoolId = user?.school_id || 1;

      // Transform CSV data to API format
      const transformedData = csvData.map((row, idx) => {
        let condition_score = null;
        
        // Try to parse condition_score as number
        if (row.condition_score) {
          const parsed = parseFloat(row.condition_score);
          if (!isNaN(parsed)) {
            condition_score = parsed;
          }
        }
        
        // Try alternative column names (case-insensitive)
        const category = row.category || row.Category || row.CATEGORY || 'other';
        const condition = row.condition || row.Condition || row.CONDITION || '';
        
        return {
          school_id: parseInt(row.school_id) || schoolId,
          category: String(category).trim().toLowerCase(),
          condition_score: condition_score, // Pass as-is (null or number)
          condition: String(condition).trim()
        };
      });

      const response = await fetch(`${API_BASE}/api/v1/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ 
          school_id: schoolId,
          csv_data: transformedData
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API returned status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.summary) {
        throw new Error('API response missing summary field');
      }

      // 7. FIX FRONTEND MAPPING
      setAnalysisSummary(data.summary);

      const formatAnalysisText = (summary, rows) => {
        const total = summary?.total_issues ?? 0;
        const critical = summary?.critical ?? 0;
        const high = summary?.high ?? 0;
        const medium = summary?.medium ?? 0;
        const low = summary?.low ?? 0;

        const header = [
          `Total Issues Found: ${total}`,
          '',
          `  Critical (need immediate action): ${critical}`,
          `  High (fix within 1 week): ${high}`,
          `  Medium (fix within 1 month): ${medium}`,
          `  Low (can wait): ${low}`,
          '',
          '==========================================================================================',
          'FULL PRIORITY QUEUE (Sorted by Urgency)',
          '==========================================================================================',
          '',
          '      school_id      category  risk_score  days_to_failure  priority_score priority_level'
        ];

        const maxRows = 50;
        const tableRows = rows.slice(0, maxRows).map((row, idx) => {
          const school = String(row.school_id).padEnd(12, ' ');
          const category = String(row.category).padEnd(12, ' ');
          const risk = String(row.risk_score).padEnd(9, ' ');
          const days = String(row.days_to_failure).padEnd(15, ' ');
          const score = String(row.priority_score).padEnd(13, ' ');
          const level = String(row.priority_level);
          return `${String(idx).padEnd(4, ' ')}${school} ${category} ${risk} ${days} ${score} ${level}`;
        });

        if (rows.length > maxRows) {
          tableRows.push('...');
        }

        const counts = [
          { level: 'Critical', count: critical },
          { level: 'High', count: high },
          { level: 'Medium', count: medium },
          { level: 'Low', count: low }
        ];

        const distribution = counts.map(({ level, count }) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          const barLength = Math.max(0, Math.round(pct / 5));
          const bar = '█'.repeat(barLength);
          return `  ${level.padEnd(10, ' ')} : ${String(count).padStart(3, ' ')} issues (${pct.toFixed(1).padStart(5, ' ')}%) ${bar}`;
        });

        return [...header, ...tableRows, '', ...distribution].join('\n');
      };

      // Format predictions directly from response data
      const analyzedPredictions = (data.data || []).map((p, idx) => ({
        id: `PRED${String(idx + 1).padStart(3, '0')}`,
        category: p.category,
        issue: `Risk detected: ${p.reason}`,
        risk_score: p.risk_score,
        priority_level: p.priority_level,
        status: 'verified',
        confidence: Math.round(p.risk_score * 100),
        reason: p.reason,
        days_to_failure: p.days_to_failure,
        priority_score: p.priority_score
      })).sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));

      setPredictions(analyzedPredictions);
      setAnalysisText(formatAnalysisText(data.summary, data.data || []));
      
      setAnalysisMessage('Analysis complete. Predictions generated from real data.');
      setAnalysisCompleted(true);

      // Clear message after 4 seconds
      setTimeout(() => {
        setAnalysisMessage(null);
      }, 4000);
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisError(`Analysis failed: ${error.message}. Check CSV format.`);
      setAnalysisText('');

      setTimeout(() => {
        setAnalysisError(null);
      }, 5000);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLoadSubmittedFile = async (filename) => {
    setLoadingFiles(true);
    setAnalysisError(null);
    setAnalysisMessage(null);

    try {
      const response = await fetch(`${API_BASE}/api/v1/peon/submitted-files/${filename}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.file_type === 'csv' && data.rows) {
        setCsvData(data.rows);
        
        // Show preview
        const preview = data.rows.slice(0, 3).map((row, idx) => 
          Object.keys(row).map(key => row[key])
        );
        setCsvPreview(preview);
        
        setUploadStatus(`✅ File loaded: ${data.row_count} records ready for analysis`);
        setAnalysisCompleted(false);
        setPredictions([]);
        setAnalysisSummary(null);
        setAnalysisMessage(`📁 Loaded: ${filename}`);
        
        setTimeout(() => {
          setAnalysisMessage(null);
        }, 3000);
      } else if (data.file_type === 'pdf') {
        setAnalysisError('PDF files require manual processing. Please export to CSV format.');
      }
    } catch (error) {
      console.error('Error loading file:', error);
      setAnalysisError(`Error loading file: ${error.message}`);
    } finally {
      setLoadingFiles(false);
    }
  };

  const filteredWorkOrders = priorityFilter === 'All' 
    ? workOrders 
    : workOrders.filter(wo => wo.priority_level === priorityFilter);

  const filteredPredictions = priorityFilter === 'All'
    ? predictions
    : predictions.filter(p => p.priority_level === priorityFilter);

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');

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
            Principal Dashboard
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
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards - Dynamic from Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className={`p-6 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Issues</p>
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {analysisSummary?.total_issues ?? 0}
                </p>
              </div>
              <BarChart3 className={`${isDark ? 'text-purple-400' : 'text-purple-600'}`} size={40} />
            </div>
          </div>

          <div className={`p-6 rounded-lg shadow-lg ${isDark ? 'bg-red-900' : 'bg-red-100'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${isDark ? 'text-red-200' : 'text-red-600'}`}>Critical</p>
                <p className={`text-3xl font-bold ${isDark ? 'text-red-200' : 'text-red-600'}`}>
                  {analysisSummary?.critical ?? 0}
                </p>
              </div>
              <AlertTriangle className={`${isDark ? 'text-red-300' : 'text-red-600'}`} size={40} />
            </div>
          </div>

          <div className={`p-6 rounded-lg shadow-lg ${isDark ? 'bg-yellow-900' : 'bg-yellow-100'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${isDark ? 'text-yellow-200' : 'text-yellow-600'}`}>High</p>
                <p className={`text-3xl font-bold ${isDark ? 'text-yellow-200' : 'text-yellow-600'}`}>
                  {analysisSummary?.high ?? 0}
                </p>
              </div>
              <Zap className={`${isDark ? 'text-yellow-300' : 'text-yellow-600'}`} size={40} />
            </div>
          </div>

          <div className={`p-6 rounded-lg shadow-lg ${isDark ? 'bg-blue-900' : 'bg-blue-100'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${isDark ? 'text-blue-200' : 'text-blue-600'}`}>Medium</p>
                <p className={`text-3xl font-bold ${isDark ? 'text-blue-200' : 'text-blue-600'}`}>
                  {analysisSummary?.medium ?? 0}
                </p>
              </div>
              <Clock3 className={`${isDark ? 'text-blue-300' : 'text-blue-600'}`} size={40} />
            </div>
          </div>

          <div className={`p-6 rounded-lg shadow-lg ${isDark ? 'bg-green-900' : 'bg-green-100'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${isDark ? 'text-green-200' : 'text-green-600'}`}>Low</p>
                <p className={`text-3xl font-bold ${isDark ? 'text-green-200' : 'text-green-600'}`}>
                  {analysisSummary?.low ?? 0}
                </p>
              </div>
              <CheckCircle className={`${isDark ? 'text-green-300' : 'text-green-600'}`} size={40} />
            </div>
          </div>
        </div>

        {/* Pending Submissions */}
        <div className={`rounded-lg shadow-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Pending Submissions
          </h2>
          <p className={`mb-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            ⚠️ Only APPROVED submissions will be used for predictions
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>ID</th>
                  <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Category</th>
                  <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Condition</th>
                  <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Submitted By</th>
                  <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Date</th>
                  <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingSubmissions.map((sub) => (
                  <tr key={sub.submission_id} className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <td className={`px-4 py-3 text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{sub.submission_id}</td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{sub.category}</td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{sub.condition}</td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{sub.submitted_by}</td>
                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(sub.date).toLocaleDateString()}
                    </td>
                    <td className={`px-4 py-3 flex gap-2`}>
                      <button
                          onClick={() => setSelectedSubmission(sub)}
                          className={`px-3 py-1 rounded text-sm font-semibold transition flex items-center gap-1 ${
                            isDark
                              ? 'bg-blue-700 text-blue-100 hover:bg-blue-600'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          <Check size={14} /> Review
                      </button>
                      <button
                        onClick={() => handleRejectSubmission(sub.submission_id)}
                        className={`px-3 py-1 rounded text-sm font-semibold transition flex items-center gap-1 ${
                          isDark
                            ? 'bg-red-700 text-red-100 hover:bg-red-600'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                        <X size={14} /> Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submitted Files Section */}
        <div className={`rounded-lg shadow-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            📁 Files Submitted by Peons
          </h2>
          <p className={`mb-6 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Select a file submitted by peons to load it for analysis
          </p>
          
          {submittedFiles.length === 0 ? (
            <div className={`p-8 text-center rounded-lg border-2 border-dashed ${
              isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-gray-50'
            }`}>
              <Upload className={`mx-auto mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} size={40} />
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No files submitted yet. Peons can upload files from their dashboard.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {submittedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 transition hover:shadow-lg ${
                    isDark
                      ? 'border-gray-700 bg-gray-900 hover:bg-gray-800'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={`text-2xl ${file.file_type === 'csv' ? '📊' : '📄'}`}></span>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {file.original_name}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                          {file.file_type.toUpperCase()} • {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleLoadSubmittedFile(file.filename)}
                    disabled={loadingFiles}
                    className={`w-full py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${
                      loadingFiles
                        ? isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : isDark
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {loadingFiles ? (
                      <>
                        <div className="animate-spin">⏳</div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Load & Analyze
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Predictions with Verification Status */}
        <div className={`rounded-lg shadow-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              AI Predictions & Analysis Results
            </h2>
            <div className="flex items-center gap-4">
              {predictions.length > 0 && (
                <div className="flex items-center gap-2">
                  <Filter size={18} />
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className={`px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-800'
                    }`}
                  >
                    <option>All</option>
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              )}
              <button
                onClick={handleRunAnalysis}
                disabled={analyzing || analysisCompleted || !csvData}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition ${
                  analysisCompleted
                    ? isDark ? 'bg-green-700 text-green-100 cursor-not-allowed' : 'bg-green-500 text-white cursor-not-allowed'
                    : analyzing || !csvData
                    ? isDark ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : isDark ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {analysisCompleted ? (
                  <>
                    <CheckCircle size={18} />
                    Analysis Completed
                  </>
                ) : analyzing ? (
                  <>
                    <div className="animate-spin">
                      <Zap size={18} />
                    </div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    Run AI Analysis
                  </>
                )}
              </button>
            </div>
          </div>

          {analysisError && (
            <div className={`mb-4 p-4 rounded-lg border-l-4 ${
              isDark 
                ? 'bg-red-900 border-red-500 text-red-200' 
                : 'bg-red-50 border-red-500 text-red-800'
            }`}>
              <p className="font-semibold">⚠️ {analysisError}</p>
            </div>
          )}

          {analysisMessage && (
            <div className={`mb-4 p-4 rounded-lg border-l-4 ${
              isDark 
                ? 'bg-green-900 border-green-500 text-green-200' 
                : 'bg-green-50 border-green-500 text-green-800'
            }`}>
              <p className="font-semibold">{analysisMessage}</p>
            </div>
          )}

          <p className={`mb-4 text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            ℹ️ Upload a CSV file and click "Run AI Analysis" to generate predictions
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>ID</th>
                  <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Category</th>
                  <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Risk Score</th>
                  <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Days to Failure</th>
                  <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Priority Score</th>
                  <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Priority</th>
                  <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {filteredPredictions.length > 0 ? (
                  <>
                    {filteredPredictions.slice(0, 5).map((pred) => (
                      <tr key={pred.id} className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <td className={`px-4 py-3 text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{pred.id}</td>
                        <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{pred.category}</td>
                        <td className={`px-4 py-3 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{(pred.risk_score * 100).toFixed(0)}%</td>
                        <td className={`px-4 py-3 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{pred.days_to_failure} days</td>
                        <td className={`px-4 py-3 font-semibold ${isDark ? 'text-orange-300' : 'text-orange-600'}`}>{pred.priority_score}</td>
                        <td className={`px-4 py-3`}>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(pred.priority_level || 'Low')}`}>
                            {pred.priority_level || 'Low'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{pred.reason}</td>
                      </tr>
                    ))}
                    {filteredPredictions.length > 5 && (
                      <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <td colSpan="7" className={`px-4 py-3 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          📊 Showing 5 of {filteredPredictions.length} predictions (sorted by priority)
                        </td>
                      </tr>
                    )}
                  </>
                ) : predictions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className={`px-4 py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Upload CSV and click "Run AI Analysis" to see results
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan="7" className={`px-4 py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      No predictions match the selected priority filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {analysisText && (
            <div className={`mt-6 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} p-4`}>
              <h3 className={`mb-3 text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Priority Output (Text)
              </h3>
              <pre className={`whitespace-pre-wrap text-xs ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
{analysisText}
              </pre>
            </div>
          )}
        </div>

        {/* Priority Distribution Chart */}
        {analysisSummary && analysisSummary.total_issues > 0 && (
          <div className={`rounded-lg shadow-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Priority Distribution
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {['Critical', 'High', 'Medium', 'Low'].map(level => {
                const count = analysisSummary[level.toLowerCase()] ?? 0;
                const total = analysisSummary.total_issues;
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={level} className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {level}
                      </span>
                      <span className={`text-lg font-bold ${
                        level === 'Critical' ? 'text-red-500' :
                        level === 'High' ? 'text-yellow-500' :
                        level === 'Medium' ? 'text-blue-500' :
                        'text-green-500'
                      }`}>
                        {count}
                      </span>
                    </div>
                    <div className={`h-8 rounded-full overflow-hidden ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <div
                        className={`h-full flex items-center justify-center text-white text-xs font-bold transition-all ${
                          level === 'Critical' ? 'bg-red-500' :
                          level === 'High' ? 'bg-yellow-500' :
                          level === 'Medium' ? 'bg-blue-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      >
                        {percentage > 10 && `${percentage}%`}
                      </div>
                    </div>
                    <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {percentage}% of total
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Work Orders */}
        <div className={`rounded-lg shadow-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Work Orders & Contractor Assignments
            </h2>
            <div className="flex items-center gap-2">
              <Filter size={18} />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-800'
                }`}
              >
                <option>All</option>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>ID</th>
                  <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Category</th>
                  <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Issue</th>
                  <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Priority</th>
                  <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Assigned Contractor</th>
                  <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkOrders.length > 0 ? filteredWorkOrders.map((wo) => (
                  <tr key={wo.id} className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <td className={`px-4 py-3 text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{wo.id}</td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{wo.category}</td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{wo.issue}</td>
                        <td className={`px-4 py-3`}>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(wo.priority_level)}`}>
                            {wo.priority_level}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{wo.assigned_contractor}</td>
                    <td className={`px-4 py-3`}>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            wo.status?.toLowerCase() === 'completed'
                          ? isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                          : isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {wo.status.charAt(0).toUpperCase() + wo.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className={`px-4 py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      No work orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>


        {/* Work Order Review Modal */}
        {selectedWorkOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl p-6 bg-white dark:bg-gray-800">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Review Completed Work</h2>
                <button onClick={() => setSelectedWorkOrder(null)} className="p-2 hover:bg-red-500 hover:text-white rounded-full transition">
                  <X size={24} />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500 font-semibold mb-1 block">Contractor</label>
                    <p className="font-semibold">{selectedWorkOrder.assigned_contractor}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 font-semibold mb-1 block">Completion Notes</label>
                    <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                      {selectedWorkOrder.completion_notes || 'No notes provided'}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 font-semibold mb-1 block">Feedback / Reason</label>
                    <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                      {selectedWorkOrder.feedback_notes || 'No feedback provided'}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 font-semibold mb-1 block">Cost Status</label>
                    <p className="font-semibold text-green-500">{selectedWorkOrder.actual_cost ? '$'+selectedWorkOrder.actual_cost : 'Within Budget'}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-500 font-semibold mb-2 block">Completion Photo</label>
                  {selectedWorkOrder.after_photos ? (
                    <div className="rounded-lg overflow-hidden border-2 border-green-500 shadow-lg">
                      <img src={selectedWorkOrder.after_photos} alt="Completed Work" className="w-full h-48 object-cover hover:scale-105 transition duration-300" />
                    </div>
                  ) : (
                    <div className="w-full h-48 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                      <p className="text-gray-500">No Photo Uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CSV Upload */}
        <div className={`rounded-lg shadow-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Upload Data
          </h2>
          <div className={`border-2 border-dashed rounded-lg p-8 text-center ${
            isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
          }`}>
            <Upload size={32} className={`mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
              />
              <span className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Click to upload or drag & drop
              </span>
              <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                CSV files only
              </p>
            </label>
          </div>
          {uploadStatus && (
            <p className={`mt-4 text-sm font-semibold ${uploadStatus.startsWith('✅') ? 'text-green-500' : 'text-red-500'}`}>
              {uploadStatus}
            </p>
          )}
          {csvPreview && (
            <div className="mt-6">
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Preview
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody>
                    {csvPreview.map((row, idx) => (
                      <tr key={idx} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className={`px-4 py-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {cell.trim()}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-2xl rounded-xl shadow-2xl p-6 ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Review Submission: {selectedSubmission.submission_id}</h3>
              <button onClick={() => setSelectedSubmission(null)} className="text-gray-500 hover:text-gray-300">
                <X size={24} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {selectedSubmission.photo_url ? (
                   <img src={selectedSubmission.photo_url} alt="Submission" className="w-full h-64 object-cover rounded-lg border border-gray-600" />
                ) : (
                   <div className="w-full h-64 bg-gray-700 flex items-center justify-center rounded-lg border border-gray-600 text-gray-400">No Photo Attached</div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400">Category</p>
                  <p className="font-semibold text-lg">{selectedSubmission.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Condition</p>
                  <p className="font-semibold text-lg">{selectedSubmission.condition}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Submitted By</p>
                  <p className="font-semibold text-lg">{selectedSubmission.submitted_by}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Date</p>
                  <p className="font-semibold text-lg">{new Date(selectedSubmission.date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4 border-t border-gray-700 pt-4">
              <button
                onClick={() => setSelectedSubmission(null)}
                className={`px-4 py-2 rounded font-semibold ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleApproveSubmission(selectedSubmission.submission_id);
                  setSelectedSubmission(null);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-semibold flex items-center gap-2"
              >
                <Check size={18} /> Approve Issue
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardPrincipal;
