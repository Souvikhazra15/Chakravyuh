import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { LogOut, CheckCircle, Clock, MapPin, Camera } from 'lucide-react';

const DashboardContractor = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [completionData, setCompletionData] = useState({
    notes: '',
    photo: null,
    latitude: '',
    longitude: '',
    photoUrl: ''
  });

  useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        const contractorName = user?.name || '';
        if (!contractorName) return;
        
        const response = await fetch(`${API_BASE}/api/v1/work-orders?contractor=${encodeURIComponent(contractorName)}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        const data = await response.json();
        const orders = Array.isArray(data) ? data : (data.workOrders || data.work_orders || []);
        setWorkOrders(orders);
      } catch (error) {
        console.error('Error fetching work orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkOrders();
    
    // Auto-refresh work orders every 10 seconds
    const intervalId = setInterval(fetchWorkOrders, 10000);
    return () => clearInterval(intervalId);
  }, [API_BASE, user?.name]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800';
      case 'Completed': return isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800';
      default: return isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (level) => {
    switch (level) {
      case 'Critical': return isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800';
      case 'High': return isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800';
      case 'Medium': return isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800';
      case 'Low': return isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800';
      default: return isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800';
    }
  };

  const handleStartWork = async (order) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/work-orders/${order.id}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (response.ok) {
        setWorkOrders(workOrders.map((wo) =>
          wo.id === order.id ? { ...wo, status: 'In Progress' } : wo
        ));
      }
    } catch (error) {
      console.error('Error starting work:', error);
    }
  };

  const handleCompleteWork = async () => {
    if (!selectedOrder) return;

    const gpsLocation = completionData.latitude && completionData.longitude
      ? `${completionData.latitude}, ${completionData.longitude}`
      : '';
    const payload = {
      work_id: selectedOrder.id,
      photo_url: completionData.photoUrl || (completionData.photo ? completionData.photo.name : ''),
      gps_location: gpsLocation || null,
      notes: completionData.notes
    };

    try {
      const response = await fetch(`${API_BASE}/api/v1/complete-work`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setWorkOrders(workOrders.map(wo => 
          wo.id === selectedOrder.id ? { ...wo, status: 'Completed' } : wo
        ));
        setSelectedOrder(null);
        setCompletionData({ notes: '', photo: null, latitude: '', longitude: '', photoUrl: '' });
        setSuccessMessage('Work completed successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error completing work:', error);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCompletionData({
          ...completionData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      });
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' 
        : 'bg-gradient-to-br from-orange-500 to-red-600'
    }`}>
      {/* Navbar */}
      <nav className={`${isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-white'} shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Chakravyuh - Contractor
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className={`p-4 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Work Orders</p>
            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{workOrders.length}</p>
          </div>
          <div className={`p-4 rounded-lg shadow-lg ${isDark ? 'bg-blue-900' : 'bg-blue-50'}`}>
            <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>In Progress</p>
            <p className={`text-3xl font-bold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              {workOrders.filter(w => w.status === 'In Progress').length}
            </p>
          </div>
          <div className={`p-4 rounded-lg shadow-lg ${isDark ? 'bg-green-900' : 'bg-green-50'}`}>
            <p className={`text-sm ${isDark ? 'text-green-200' : 'text-green-700'}`}>Completed</p>
            <p className={`text-3xl font-bold ${isDark ? 'text-green-300' : 'text-green-700'}`}>
              {workOrders.filter(w => w.status === 'Completed').length}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Work Orders List */}
          <div className={`lg:col-span-2 rounded-lg shadow-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Assigned Work Orders
                </h2>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Filtering by: <strong>{user?.name || 'Unknown'}</strong>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const contractorName = user?.name || '';
                    fetch(`${API_BASE}/api/v1/work-orders?contractor=${encodeURIComponent(contractorName)}`, {
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                      }
                    })
                      .then(r => r.json())
                      .then(data => {
                        console.log(`Work orders for "${contractorName}":`, data);
                        alert(`FILTERED by "${contractorName}":\n${JSON.stringify(data, null, 2)}`);
                      });
                  }}
                  className={`px-3 py-1 rounded text-xs font-semibold ${isDark ? 'bg-blue-700 text-blue-100 hover:bg-blue-600' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                  My Orders
                </button>
                <button
                  onClick={() => {
                    fetch(`${API_BASE}/api/v1/work-orders`, {
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                      }
                    })
                      .then(r => r.json())
                      .then(data => {
                        console.log('ALL work orders in system:', data);
                        alert(`ALL WORK ORDERS (${data.length || 0} total):\n${JSON.stringify(data, null, 2)}`);
                      });
                  }}
                  className={`px-3 py-1 rounded text-xs font-semibold ${isDark ? 'bg-purple-700 text-purple-100 hover:bg-purple-600' : 'bg-purple-500 text-white hover:bg-purple-600'}`}
                >
                  All Orders (Debug)
                </button>
              </div>
            </div>
            {successMessage && (
              <span className={`inline-block mb-4 rounded-full px-3 py-1 text-xs font-semibold ${isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700'}`}>
                {successMessage} ✅
              </span>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <Clock className={`animate-spin ${isDark ? 'text-gray-400' : 'text-gray-500'}`} size={40} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                {workOrders.length === 0 ? (
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No work orders assigned</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`${isDark ? 'text-gray-400' : 'text-gray-600'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <th className="py-2 text-left">School</th>
                        <th className="py-2 text-left">Category</th>
                        <th className="py-2 text-left">Priority</th>
                        <th className="py-2 text-left">Status</th>
                        <th className="py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workOrders.map((order) => (
                        <tr
                          key={order.id}
                          className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700/40' : 'border-gray-200 hover:bg-gray-50'} cursor-pointer`}
                          onClick={() => setSelectedOrder(order)}
                        >
                          <td className={`py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{order.school_id}</td>
                          <td className={`py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{order.category}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(order.priority_level || 'Medium')}`}>
                              {order.priority_level || 'Medium'}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3 flex gap-2">
                            {order.status === 'Pending' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartWork(order);
                                }}
                                className={`px-3 py-1 rounded text-xs font-semibold ${isDark ? 'bg-blue-700 text-blue-100 hover:bg-blue-600' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                              >
                                Start Work
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(order);
                              }}
                              className={`px-3 py-1 rounded text-xs font-semibold ${isDark ? 'bg-green-700 text-green-100 hover:bg-green-600' : 'bg-green-500 text-white hover:bg-green-600'}`}
                            >
                              Mark Completed
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>

          {/* Completion Form */}
          {selectedOrder && (
            <div className={`rounded-lg shadow-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Complete Work
              </h3>

              <div className="space-y-4">
                {/* Order Details */}
                <div className={`p-3 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <p className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>SCHOOL</p>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.school_id}</p>
                  <p className={`text-xs font-semibold mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>CATEGORY</p>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.category}</p>
                </div>

                {/* Notes */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Work Notes
                  </label>
                  <textarea
                    value={completionData.notes}
                    onChange={(e) => setCompletionData({ ...completionData, notes: e.target.value })}
                    rows="3"
                    className={`w-full px-3 py-2 rounded border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Describe the work completed..."
                  />
                </div>

                {/* Photo Upload */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Photo Evidence
                  </label>
                  <div className={`border-2 border-dashed rounded p-3 text-center cursor-pointer ${
                    isDark ? 'border-gray-600 hover:border-orange-500' : 'border-gray-300 hover:border-orange-500'
                  }`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setCompletionData({
                          ...completionData,
                          photo: file,
                          photoUrl: file ? URL.createObjectURL(file) : ''
                        });
                      }}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="flex items-center justify-center gap-2 cursor-pointer">
                      <Camera size={18} />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {completionData.photo ? completionData.photo.name : 'Upload photo'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* GPS Location */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    GPS Location
                  </label>
                  <button
                    onClick={getLocation}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded transition ${
                      isDark
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    <MapPin size={16} />
                    Get Current Location
                  </button>
                  {completionData.latitude && (
                    <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Lat: {completionData.latitude.toFixed(4)}, Lon: {completionData.longitude.toFixed(4)}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleCompleteWork}
                  className={`w-full py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                    isDark
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  <CheckCircle size={18} />
                  Mark as Completed
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardContractor;
