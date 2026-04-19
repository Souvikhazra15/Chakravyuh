import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import Chatbot from '../components/Chatbot';
import { LogOut, ChevronDown, X } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const CONTRACTORS = [
  { id: 'c1', name: 'Suresh Kumar', specialty: 'plumbing' },
  { id: 'c2', name: 'Ramesh Patel', specialty: 'electrical' },
  { id: 'c3', name: 'Rajendra Singh', specialty: 'structural' }
];

const SAMPLE_ALERTS = [
  {
    school_id: 'SCHOOL_001',
    category: 'plumbing',
    priority_score: 3.8,
    priority_level: 'Critical',
    days_to_failure: 32,
    risk_score: 0.82,
    status: 'Pending'
  },
  {
    school_id: 'SCHOOL_002',
    category: 'electrical',
    priority_score: 2.9,
    priority_level: 'High',
    days_to_failure: 41,
    risk_score: 0.74,
    status: 'Pending'
  },
  {
    school_id: 'SCHOOL_003',
    category: 'structural',
    priority_score: 2.2,
    priority_level: 'Medium',
    days_to_failure: 54,
    risk_score: 0.61,
    status: 'Assigned'
  },
  {
    school_id: 'SCHOOL_004',
    category: 'plumbing',
    priority_score: 1.4,
    priority_level: 'Low',
    days_to_failure: 68,
    risk_score: 0.43,
    status: 'Completed'
  }
];

const PRIORITY_STYLES = {
  Critical: {
    border: 'border-red-500',
    badge: 'bg-red-500 text-white',
    dot: 'bg-red-500'
  },
  High: {
    border: 'border-orange-500',
    badge: 'bg-orange-500 text-white',
    dot: 'bg-orange-500'
  },
  Medium: {
    border: 'border-yellow-500',
    badge: 'bg-yellow-500 text-black',
    dot: 'bg-yellow-500'
  },
  Low: {
    border: 'border-green-500',
    badge: 'bg-green-500 text-white',
    dot: 'bg-green-500'
  }
};

const getPriorityLevel = (item) => {
  if (item.priority_level) return item.priority_level;
  const score = Number(item.priority_score) || 0;
  if (score >= 3.5) return 'Critical';
  if (score >= 2.5) return 'High';
  if (score >= 1.5) return 'Medium';
  return 'Low';
};

const toTitle = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const ContractorModal = ({ isOpen, onClose, alertItem, onAssign }) => {
  const [selectedContractor, setSelectedContractor] = useState('');

  useEffect(() => {
    if (!alertItem) return;
    const suggested = CONTRACTORS.find(
      (c) => c.specialty === alertItem.category
    );
    setSelectedContractor(suggested ? suggested.id : '');
  }, [alertItem]);

  if (!isOpen || !alertItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-gray-900 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-700 px-6 py-4">
          <h3 className="text-lg font-semibold">Assign Contractor</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
            <p className="text-sm text-gray-400">School</p>
            <p className="text-base font-semibold text-white">{alertItem.school_id}</p>
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
              <span className="rounded-full bg-gray-700 px-2 py-1">
                {toTitle(alertItem.category)}
              </span>
              <span className="rounded-full bg-gray-700 px-2 py-1">
                {alertItem.priority_level} Priority
              </span>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-300">
              Suggested contractor
            </label>
            <div className="relative">
              <select
                value={selectedContractor}
                onChange={(e) => setSelectedContractor(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white"
              >
                <option value="">Select a contractor</option>
                {CONTRACTORS.map((contractor) => (
                  <option key={contractor.id} value={contractor.id}>
                    {contractor.name} — {toTitle(contractor.specialty)} Specialist
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>
          <button
            onClick={() => onAssign(selectedContractor)}
            disabled={!selectedContractor}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-700"
          >
            Assign Contractor
          </button>
        </div>
      </div>
    </div>
  );
};

const SchoolDetailModal = ({ isOpen, onClose, school }) => {
  if (!isOpen || !school) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-gray-900 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-700 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold">School Details</h3>
            <p className="text-sm text-gray-400">{school.school_id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-6 px-6 py-5">
          <div>
            <h4 className="text-sm font-semibold uppercase text-gray-400">Category Predictions</h4>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {school.predictions.map((prediction) => (
                <div
                  key={prediction.category}
                  className="rounded-lg border border-gray-700 bg-gray-800 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">
                      {toTitle(prediction.category)}
                    </span>
                    <span className="rounded-full bg-gray-700 px-2 py-1 text-xs text-gray-200">
                      {prediction.priority_level}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-300">
                    <div>
                      <p className="text-xs uppercase text-gray-400">Risk Score</p>
                      <p className="font-semibold">{prediction.risk_score.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-400">Days to Failure</p>
                      <p className="font-semibold">{prediction.days_to_failure}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase text-gray-400">Historical Issues</h4>
            <div className="mt-3 space-y-2 text-sm text-gray-300">
              {school.history.length === 0 ? (
                <p className="text-gray-500">No historical issues available.</p>
              ) : (
                school.history.map((item, index) => (
                  <div key={index} className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.date}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase text-gray-400">Status</h4>
            <div className="mt-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-200">
              {school.status}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardDEO = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSchoolOpen, setIsSchoolOpen] = useState(false);
  const [sortByPriority, setSortByPriority] = useState(true);
  const [workOrders, setWorkOrders] = useState([]);
  const [workOrdersLoading, setWorkOrdersLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        // Fetch both queue and approved submissions
        const [queueResponse, approvedResponse] = await Promise.all([
          fetch(`${API_BASE}/api/v1/deo/queue`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`
            }
          }).catch(() => null),
          fetch(`${API_BASE}/api/v1/deo/approved-submissions`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`
            }
          }).catch(() => null)
        ]);

        let allAlerts = [];

        // Get queue data
        if (queueResponse?.ok) {
          const data = await queueResponse.json();
          const queueData = Array.isArray(data) ? data : (data.queue || []);
          if (queueData.length > 0) {
            allAlerts = allAlerts.concat(queueData);
          }
        }

        // Get approved submissions
        if (approvedResponse?.ok) {
          const data = await approvedResponse.json();
          const approvedData = Array.isArray(data) ? data : [];
          if (approvedData.length > 0) {
            allAlerts = allAlerts.concat(approvedData);
          }
        }

        if (allAlerts.length > 0) {
          const normalized = allAlerts.map((item) => ({
            ...item,
            priority_level: getPriorityLevel(item),
            priority_score: Number(item.priority_score || 0),
            days_to_failure: Number(item.days_to_failure || 0)
          }));
          setAlerts(normalized);
        } else {
          setAlerts(SAMPLE_ALERTS);
        }
      } catch (error) {
        console.error('Error fetching alerts:', error);
        setAlerts(SAMPLE_ALERTS);
      } finally {
        setLoading(false);
      }
    };

    const fetchWorkOrders = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/work-orders`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        const data = await response.json();
        const orders = Array.isArray(data) ? data : (data.workOrders || data.work_orders || []);
        setWorkOrders(orders);
      } catch (error) {
        setWorkOrders([]);
      } finally {
        setWorkOrdersLoading(false);
      }
    };

    fetchAlerts();
    fetchWorkOrders();

    const intervalId = setInterval(fetchWorkOrders, 15000);
    return () => clearInterval(intervalId);
  }, []);

  const rankedAlerts = useMemo(() => {
    const sorted = [...alerts].sort((a, b) => b.priority_score - a.priority_score);
    return sorted.map((alert, index) => ({
      ...alert,
      priority_rank: `P${index + 1}`
    }));
  }, [alerts]);

  const displayAlerts = sortByPriority ? rankedAlerts : [...alerts];

  const stats = useMemo(() => {
    const levels = rankedAlerts.map((alert) => alert.priority_level);
    return {
      total: rankedAlerts.length,
      critical: levels.filter((level) => level === 'Critical').length,
      high: levels.filter((level) => level === 'High').length
    };
  }, [rankedAlerts]);

  const schoolCards = useMemo(() => {
    const grouped = new Map();
    rankedAlerts.forEach((alert) => {
      if (!grouped.has(alert.school_id)) {
        grouped.set(alert.school_id, []);
      }
      grouped.get(alert.school_id).push(alert);
    });

    return Array.from(grouped.entries()).map(([school_id, items]) => {
      const topItem = items[0];
      return {
        school_id,
        issues: items.length,
        priority_level: topItem.priority_level,
        status: items.some((item) => item.status === 'Assigned')
          ? 'Assigned'
          : items.some((item) => item.status === 'Completed')
          ? 'Completed'
          : 'Pending',
        predictions: items.map((item) => ({
          category: item.category,
          risk_score: item.risk_score || 0.65,
          days_to_failure: item.days_to_failure || 35,
          priority_level: item.priority_level
        })),
        history: []
      };
    });
  }, [rankedAlerts]);

  const openAssignModal = (alert) => {
    setSelectedSchool(alert);
    setIsModalOpen(true);
  };

  const handleAssign = async (contractorId) => {
    const contractor = CONTRACTORS.find((c) => c.id === contractorId);
    if (!contractor || !selectedSchool) return;

    const payload = {
      school_id: selectedSchool.school_id,
      category: selectedSchool.category,
      priority_score: selectedSchool.priority_score,
      priority_level: selectedSchool.priority_level,
      assigned_contractor: contractor.name,
      issue: selectedSchool.reason || 'Maintenance required'
    };

    let createdOrder = null;
    try {
      const response = await fetch(`${API_BASE}/api/v1/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        createdOrder = await response.json();
      }
    } catch (error) {
      // fallback to UI-only assignment
    }

    if (createdOrder) {
      setWorkOrders((prev) => [createdOrder, ...prev]);
      setSuccessMessage('Work order assigned successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    }

    setAlerts((prev) =>
      prev.map((item) =>
        item.school_id === selectedSchool.school_id && item.category === selectedSchool.category
          ? { ...item, status: 'Pending' }
          : item
      )
    );
    setIsModalOpen(false);
  };

  const openSchoolDetails = (school) => {
    setSelectedSchool(school);
    setIsSchoolOpen(true);
  };

  const getPriorityStyles = (level) => PRIORITY_STYLES[level] || PRIORITY_STYLES.Low;
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Pending':
        return isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800';
      case 'In Progress':
        return isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800';
      case 'Completed':
        return isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800';
      default:
        return isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-50'} text-gray-900`}>
      <nav className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b shadow-lg`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              District Operations Dashboard
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              AI Predictive Maintenance System
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={logout}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                isDark
                  ? 'bg-red-900 text-red-100 hover:bg-red-800'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className={`rounded-lg p-6 shadow ${isDark ? 'bg-gray-900 text-white' : 'bg-white'}`}>
            <p className={`text-xs uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Alerts</p>
            <p className="mt-2 text-3xl font-bold">{stats.total}</p>
          </div>
          <div className={`rounded-lg p-6 shadow ${isDark ? 'bg-gray-900 text-white' : 'bg-white'}`}>
            <p className={`text-xs uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Critical</p>
            <p className="mt-2 text-3xl font-bold text-red-500">{stats.critical}</p>
          </div>
          <div className={`rounded-lg p-6 shadow ${isDark ? 'bg-gray-900 text-white' : 'bg-white'}`}>
            <p className={`text-xs uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>High Priority</p>
            <p className="mt-2 text-3xl font-bold text-orange-500">{stats.high}</p>
          </div>
        </section>

        <section className={`rounded-lg p-6 shadow ${isDark ? 'bg-gray-900 text-white' : 'bg-white'}`}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Priority Alerts</h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Ranked by AI priority score
              </p>
            </div>
            <button
              onClick={() => setSortByPriority((prev) => !prev)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                isDark
                  ? 'bg-blue-700 text-white hover:bg-blue-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Sort by Priority
            </button>
          </div>

          {loading ? (
            <div className={`rounded-lg border ${isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50'} p-6 text-center`}>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading alerts...</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {displayAlerts.map((alert) => {
                const priorityLevel = getPriorityLevel(alert);
                const styles = getPriorityStyles(priorityLevel);
                return (
                  <div
                    key={`${alert.school_id}-${alert.category}`}
                    className={`rounded-lg border-l-4 ${styles.border} ${isDark ? 'bg-gray-950' : 'bg-gray-50'} p-4 shadow`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          School ID
                        </p>
                        <button
                          onClick={() => openSchoolDetails({
                            school_id: alert.school_id,
                            predictions: [
                              {
                                category: alert.category,
                                risk_score: alert.risk_score || 0.7,
                                days_to_failure: alert.days_to_failure,
                                priority_level: priorityLevel
                              }
                            ],
                            history: [],
                            status: alert.status || 'Pending'
                          })}
                          className="text-lg font-semibold text-blue-500 hover:underline"
                        >
                          {alert.school_id}
                        </button>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}>
                          {priorityLevel}
                        </span>
                        <p className="mt-2 text-xs font-semibold text-gray-500">
                          Priority Rank {alert.priority_rank || 'P1'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Category</p>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {toTitle(alert.category)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Days to Failure</p>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {alert.days_to_failure}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Priority Score</p>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {alert.priority_score?.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status</p>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {alert.status || 'Pending'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className={`inline-flex items-center gap-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
                        {alert.priority_rank || 'P1'}
                      </span>
                      <button
                        onClick={() => openAssignModal({
                          ...alert,
                          priority_level: priorityLevel
                        })}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                          isDark
                            ? 'bg-blue-700 text-white hover:bg-blue-600'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        Assign Contractor
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className={`rounded-lg p-6 shadow ${isDark ? 'bg-gray-900 text-white' : 'bg-white'}`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Assigned Work</h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Track contractor assignments in progress
              </p>
            </div>
            {successMessage && (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700'}`}>
                {successMessage}
              </span>
            )}
          </div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Updates every 15 seconds
          </p>
          <div className="mt-4 space-y-3">
            {workOrdersLoading ? (
              <div className={`rounded-lg border ${isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50'} p-4 text-sm text-gray-500`}>
                Loading work orders...
              </div>
            ) : workOrders.length === 0 ? (
              <div className={`rounded-lg border ${isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50'} p-4 text-sm text-gray-500`}>
                No assignments yet. Assign a contractor to start tracking.
              </div>
            ) : (
              workOrders.map((item) => (
                <div key={`${item.id}`} className={`rounded-lg border ${isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50'} p-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{item.school_id} — {toTitle(item.category)}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Assigned to {item.assigned_contractor || item.assigned_to || 'Unassigned'}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusStyle(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className={`rounded-lg p-6 shadow ${isDark ? 'bg-gray-900 text-white' : 'bg-white'}`}>
          <h2 className="text-xl font-bold">School Details</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Drill down into any school to view prediction details.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {schoolCards.map((school) => {
              const styles = getPriorityStyles(school.priority_level);
              return (
                <button
                  key={school.school_id}
                  onClick={() => openSchoolDetails(school)}
                  className={`rounded-lg border-l-4 ${styles.border} ${isDark ? 'bg-gray-950' : 'bg-gray-50'} p-4 text-left shadow transition hover:shadow-lg`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{school.school_id}</p>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${styles.badge}`}>
                      {school.priority_level}
                    </span>
                  </div>
                  <p className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {school.issues} active alerts
                  </p>
                  <p className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Status: {school.status}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      <ContractorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        alertItem={selectedSchool}
        onAssign={handleAssign}
      />

      <SchoolDetailModal
        isOpen={isSchoolOpen}
        onClose={() => setIsSchoolOpen(false)}
        school={selectedSchool}
      />

      <Chatbot dashboard="DEO Dashboard" />
    </div>
  );
};

export default DashboardDEO;
