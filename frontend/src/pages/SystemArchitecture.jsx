import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Upload, CheckCircle, AlertTriangle, TrendingUp, Zap, BarChart3, Users } from 'lucide-react';

export default function SystemArchitecture() {
  const { isDark } = useTheme();
  const [csvFile, setCsvFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineResult, setPipelineResult] = useState(null);
  const [error, setError] = useState('');

  const architectureBlocks = [
    {
      num: '01',
      title: 'Data Collection & Intake',
      description: 'School staff submit weekly condition reports via structured dropdown form for plumbing, electrical, and structural categories.',
      icon: <Upload className="w-8 h-8" />,
      color: 'blue'
    },
    {
      num: '02',
      title: 'Data Processing & Normalization',
      description: 'System cleans, validates, and converts reports into standardized condition scores (0-100) for trend analysis.',
      icon: <CheckCircle className="w-8 h-8" />,
      color: 'green'
    },
    {
      num: '03',
      title: 'Feature Engineering & Patterns',
      description: 'Creates rolling averages, trend lines, and historical patterns to detect subtle deterioration trajectories over time.',
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'purple'
    },
    {
      num: '04',
      title: 'Hybrid Anomaly Detection',
      description: 'Combines Z-score statistical outliers with Isolation Forest ML to identify abnormal deterioration patterns automatically.',
      icon: <AlertTriangle className="w-8 h-8" />,
      color: 'red'
    },
    {
      num: '05',
      title: 'AI Prediction & Explanations',
      description: 'Generates 30–60 day failure predictions with transparent explanations showing WHY the risk is predicted (no black-box).',
      icon: <Zap className="w-8 h-8" />,
      color: 'yellow'
    },
    {
      num: '06',
      title: 'DEO Dashboard & Dispatch',
      description: 'DEO views AI-prioritized maintenance queue, assigns contractors, and tracks completion proof from field work orders.',
      icon: <Users className="w-8 h-8" />,
      color: 'indigo'
    }
  ];

  const colorMap = {
    blue: { card: isDark ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200', icon: 'text-blue-500', title: isDark ? 'text-blue-300' : 'text-blue-900' },
    green: { card: isDark ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200', icon: 'text-green-500', title: isDark ? 'text-green-300' : 'text-green-900' },
    purple: { card: isDark ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200', icon: 'text-purple-500', title: isDark ? 'text-purple-300' : 'text-purple-900' },
    red: { card: isDark ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200', icon: 'text-red-500', title: isDark ? 'text-red-300' : 'text-red-900' },
    yellow: { card: isDark ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200', icon: 'text-yellow-500', title: isDark ? 'text-yellow-300' : 'text-yellow-900' },
    indigo: { card: isDark ? 'bg-indigo-900/30 border-indigo-700' : 'bg-indigo-50 border-indigo-200', icon: 'text-indigo-500', title: isDark ? 'text-indigo-300' : 'text-indigo-900' },
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setCsvFile(file);
    setError('');
    
    // Send to backend
    await processCSV(file);
  };

  const processCSV = async (file) => {
    setIsProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://127.0.0.1:8000/api/v1/pipeline/process-csv', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
      }

      const result = await response.json();
      setPipelineResult(result);
    } catch (err) {
      setError(`Error processing file: ${err.message}`);
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`py-12 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            System Architecture
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            End-to-end AI pipeline for predictive school infrastructure maintenance
          </p>
        </div>
      </div>

      {/* Architecture Grid */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {architectureBlocks.map((block, idx) => {
            const colors = colorMap[block.color];
            return (
              <div
                key={idx}
                className={`p-6 rounded-xl border-2 transition hover:shadow-lg ${colors.card}`}
              >
                {/* Block Number */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <span className={`font-bold text-sm ${colors.title}`}>{block.num}</span>
                </div>

                {/* Icon */}
                <div className={`mb-4 ${colors.icon}`}>
                  {block.icon}
                </div>

                {/* Title */}
                <h3 className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {block.title}
                </h3>

                {/* Description */}
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                  {block.description}
                </p>

                {/* Arrow to next block (except last) */}
                {idx < architectureBlocks.length - 1 && (
                  <div className={`hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 text-2xl ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CSV Upload & Results Section */}
        <div className={`rounded-xl border-2 p-8 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Test Pipeline with CSV Data
          </h2>

          {/* Upload Area */}
          <div className="mb-8">
            <label className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition ${
              isDark 
                ? 'border-gray-600 hover:border-blue-500 bg-gray-800/50' 
                : 'border-gray-300 hover:border-blue-500 bg-gray-50'
            }`}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className={`w-10 h-10 mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                <p className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                  Click to upload CSV or drag and drop
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Expected format: school_id, category, condition, timestamp
                </p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="hidden"
              />
            </label>
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <div className={`p-4 rounded-lg mb-6 ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-900'}`}>
              ⏳ Processing CSV through pipeline...
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className={`p-4 rounded-lg mb-6 ${isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-900'}`}>
              ❌ {error}
            </div>
          )}

          {/* Results Display */}
          {pipelineResult && (
            <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Pipeline Results
              </h3>

              {/* Processing Stats */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white border'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Records Processed</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    {pipelineResult.stats?.processed_records || 0}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white border'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Risk Cases Found</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    {pipelineResult.predictions?.length || 0}
                  </p>
                </div>
              </div>

              {/* Predictions Table */}
              {pipelineResult.predictions && pipelineResult.predictions.length > 0 && (
                <div className="overflow-x-auto">
                  <table className={`w-full text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    <thead className={isDark ? 'bg-gray-700' : 'bg-gray-100'}>
                      <tr>
                        <th className="px-4 py-2 text-left">School</th>
                        <th className="px-4 py-2 text-left">Category</th>
                        <th className="px-4 py-2 text-left">Risk Score</th>
                        <th className="px-4 py-2 text-left">Days to Failure</th>
                        <th className="px-4 py-2 text-left">Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pipelineResult.predictions.map((pred, idx) => (
                        <tr key={idx} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                          <td className="px-4 py-2">{pred.school_id}</td>
                          <td className="px-4 py-2">{pred.category}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded ${
                              pred.risk_score > 70 ? 'bg-red-900/50 text-red-300' : 
                              pred.risk_score > 50 ? 'bg-yellow-900/50 text-yellow-300' : 
                              'bg-green-900/50 text-green-300'
                            }`}>
                              {(pred.risk_score * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-2">{pred.days_to_failure}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded font-semibold ${
                              pred.priority === 'critical' ? 'bg-red-900/50 text-red-300' :
                              pred.priority === 'high' ? 'bg-yellow-900/50 text-yellow-300' :
                              'bg-blue-900/50 text-blue-300'
                            }`}>
                              {pred.priority?.toUpperCase() || 'MEDIUM'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Explanations */}
              {pipelineResult.explanations && pipelineResult.explanations.length > 0 && (
                <div className="mt-6">
                  <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    AI Explanations (Why predictions were made)
                  </h4>
                  <div className="space-y-2">
                    {pipelineResult.explanations.map((explain, idx) => (
                      <p key={idx} className={`text-sm p-2 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100'}`}>
                        • {explain}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
