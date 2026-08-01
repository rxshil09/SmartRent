import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeOrders: 0,
  });
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [reportsStatsRes, usersStatsRes, ordersRes] = await Promise.all([
        api.get('/reports/dashboard-stats').catch(() => ({ data: {} })),
        api.get('/users/stats').catch(() => ({ data: {} })),
        api.get('/rentals/orders').catch(() => ({ data: { items: [] } }))
      ]);

      const repStats = reportsStatsRes.data || {};
      const usrStats = usersStatsRes.data || {};
      const allOrders = ordersRes.data.items || [];

      setStats({
        totalUsers: usrStats.customers || 0,
        totalProducts: repStats.totalProducts || 0,
        totalOrders: repStats.totalRentals || 0,
        totalRevenue: repStats.totalRevenue || 0,
        activeOrders: repStats.activeRentals || 0,
      });

      // Filter for PAID orders (awaiting admin approval) and take the top 5
      const pending = allOrders
        .filter(order => order.status === 'PAID')
        .slice(0, 5);
      
      setPendingOrders(pending);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Confirm whole parent checkout order
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/rentals/orders/${orderId}/status`, { status: newStatus });
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleAddProduct = () => navigate('/admin/products/new');
  const handleViewOrders = () => navigate('/admin/orders');
  const handleManageUsers = () => navigate('/admin/users');

  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const statCards = [
    {
      name: 'Total Customers',
      value: stats.totalUsers,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      bgClass: 'bg-blue-50 text-blue-600 border border-blue-100',
    },
    {
      name: 'Total Catalog Products',
      value: stats.totalProducts,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      bgClass: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    },
    {
      name: 'Active Rentals',
      value: stats.activeOrders,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      bgClass: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    },
    {
      name: 'Total Revenue Generated',
      value: formatCurrency(stats.totalRevenue),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      bgClass: 'bg-amber-50 text-amber-600 border border-amber-100',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="px-6 sm:px-8 font-sans space-y-6">
      {/* Welcome Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Overview Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">Real-time statistics metrics and queue updates</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="inline-flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-bold border border-gray-150 rounded-xl text-xs shadow-sm transition-all"
        >
          Refresh Live
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className={`w-10 h-10 ${stat.bgClass} rounded-xl flex items-center justify-center`}>
                {stat.icon}
              </div>
              <div className="ml-4 flex-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.name}</p>
                <p className="text-xl font-extrabold text-gray-800 mt-1">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid: Pending Approvals & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Orders Widget */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-base font-bold text-gray-800">Pending Approvals</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wider">
              Verification Needed
            </span>
          </div>
          <div className="p-6">
            <ul className="divide-y divide-gray-100 -my-4">
              {pendingOrders.map((order) => (
                <li key={order.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-bold text-gray-800 truncate">
                      Order #ORD-{order.id.slice(0, 6).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400 font-medium">
                      Customer: <span className="font-bold text-gray-700">{order.userName}</span>
                    </p>
                    <p className="text-xs text-gray-400 font-medium">
                      Items ({order.rentals?.length || 0}): <span className="font-semibold text-gray-600">{order.rentals?.map(r => r.product?.name).join(', ')}</span>
                    </p>
                    <p className="text-xs font-extrabold text-blue-600">
                      {formatCurrency(order.totalAmount)}
                    </p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'CONFIRMED')}
                      className="flex-grow sm:flex-grow-0 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'CANCELLED')}
                      className="flex-grow sm:flex-grow-0 bg-red-50 hover:bg-red-100 text-red-700 px-3.5 py-2 rounded-xl text-xs font-bold border border-red-100 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {pendingOrders.length === 0 && (
              <div className="text-center py-10">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500 font-bold">All pending orders have been verified!</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
            <h3 className="text-base font-bold text-gray-800">Quick Actions</h3>
          </div>
          <div className="p-6 space-y-4">
            <button
              onClick={handleAddProduct}
              className="w-full flex items-center justify-between p-4 bg-blue-50/50 hover:bg-blue-50 border border-blue-100/50 rounded-2xl transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center text-blue-600">
                <div className="w-9 h-9 bg-white border border-blue-100 rounded-xl flex items-center justify-center mr-3 shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">Add New Product</span>
              </div>
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              onClick={handleViewOrders}
              className="w-full flex items-center justify-between p-4 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100/50 rounded-2xl transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center text-emerald-600">
                <div className="w-9 h-9 bg-white border border-emerald-100 rounded-xl flex items-center justify-center mr-3 shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">View All Orders</span>
              </div>
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              onClick={handleManageUsers}
              className="w-full flex items-center justify-between p-4 bg-purple-50/50 hover:bg-purple-50 border border-purple-100/50 rounded-2xl transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center text-purple-600">
                <div className="w-9 h-9 bg-white border border-purple-100 rounded-xl flex items-center justify-center mr-3 shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">Manage Users</span>
              </div>
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
