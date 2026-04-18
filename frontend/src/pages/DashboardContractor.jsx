import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { LogOut, Briefcase, Hammer, CheckCircle, Clock, MapPin, Camera } from 'lucide-react';

const DashboardContractor = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [completionData, setCompletionData] = useState({
    notes: '',
    photo: null,
    latitude: '',
    longitude: ''
  });

  useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/v1/contractor/work-orders', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setWorkOrders(data.work_orders || []);
      } catch (error) {
        console.error('Error fetching work orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkOrders();
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800';
      case 'Completed': return isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800';
      default: return isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800';
    }
  };

  const handleCompleteWork = async () => {
    if (!selectedOrder) return;

    const formData = new FormData();
    formData.append('work_order_id', selectedOrder.id);
    formData.append('contractor_id', user?.id);
    formData.append('notes', completionData.notes);
    formData.append('latitude', completionData.latitude);
    formData.append('longitude', completionData.longitude);
    if (completionData.photo) {
      formData.append('photo', completionData.photo);
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/contractor/complete-work', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        setWorkOrders(workOrders.map(wo => 
          wo.id === selectedOrder.id ? { ...wo, status: 'Completed' } : wo
        ));
        setSelectedOrder(null);
        setCompletionData({ notes: '', photo: null, latitude: '', longitude: '' });
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
            <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Assigned Work Orders
            </h2>

            {loading ? (
              <div className="flex justify-center py-12">
                <Clock className={`animate-spin ${isDark ? 'text-gray-400' : 'text-gray-500'}`} size={40} />
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {workOrders.length === 0 ? (
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No work orders assigned</p>
                ) : (
                  workOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                        selectedOrder?.id === order.id
                          ? isDark ? 'bg-blue-900 border-blue-500' : 'bg-blue-50 border-blue-500'
                          : isDark ? 'bg-gray-700 border-gray-600 hover:border-orange-500' : 'bg-gray-50 border-gray-200 hover:border-orange-500'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {order.school_id}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {order.category}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {order.issue || 'Maintenance work required'}
                      </p>
                    </div>
                  ))
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
                      onChange={(e) => setCompletionData({ ...completionData, photo: e.target.files[0] })}
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
