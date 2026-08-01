import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import CustomerNav from '../components/CustomerNav';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeRental, setActiveRental] = useState(null);
  const [rentalHistory, setRentalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect admin users to admin panel
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else {
      fetchDashboardData();
    }
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [activeRes, historyRes] = await Promise.all([
        api.get('/rentals/active').catch(() => ({ data: { rental: null } })),
        api.get('/rentals/my-rentals').catch(() => ({ data: { items: [] } }))
      ]);

      setActiveRental(activeRes.data?.rental || null);
      setRentalHistory(historyRes.data?.items?.slice(0, 3) || []);
    } catch (err) {
      console.error('Error fetching customer dashboard:', err);
      setError('Failed to load dashboard. Please reload the page.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Pending Approval', classes: 'bg-amber-50 text-amber-700 border border-amber-100' };
      case 'CONFIRMED':
        return { label: 'Confirmed', classes: 'bg-blue-50 text-blue-700 border border-blue-100' };
      case 'PICKED_UP':
        return { label: 'Picked Up / In Use', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-100' };
      case 'RETURNED':
        return { label: 'Returned', classes: 'bg-gray-150 text-gray-700 border border-gray-200' };
      case 'CANCELLED':
        return { label: 'Cancelled', classes: 'bg-red-50 text-red-600 border border-red-100' };
      case 'OVERDUE':
        return { label: 'Overdue', classes: 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse' };
      default:
        return { label: status, classes: 'bg-gray-100 text-gray-700' };
    }
  };

  const formatCurrency = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;
  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const calculateDaysRemaining = (endDateStr) => {
    const end = new Date(endDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = end - today;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due today';
    return `${days} day${days > 1 ? 's' : ''} left`;
  };

  const getProductImage = (product) => {
    if (product?.images && product.images.length > 0) return product.images[0];
    return `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" fill="#E5E7EB"/><text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="#9CA3AF" font-family="Arial" font-size="30" font-weight="bold">${product?.name?.charAt(0) || 'P'}</text></svg>`)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <CustomerNav />
        <div className="flex-grow flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <CustomerNav />

      <main className="flex-grow max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back, {user?.name || 'Customer'}</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your active rentals, track history, and browse products.</p>
          </div>
          <Link
            to="/products"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-5 rounded-xl transition-all shadow-md hover:shadow-lg inline-flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Rental Order
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Active Rental Card */}
        {activeRental ? (
          <div className="bg-gradient-to-br from-blue-50/75 via-indigo-50/40 to-white border border-blue-100 rounded-2xl shadow-sm overflow-hidden relative">
            <div className="px-6 py-4 border-b border-blue-100/50 bg-blue-50/30 flex justify-between items-center relative z-10">
              <h3 className="text-sm font-extrabold tracking-wider uppercase text-blue-700">Ongoing Rental Status</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold bg-blue-500 text-white shadow-sm`}>
                {getStatusBadge(activeRental.status).label}
              </span>
            </div>
            
            <div className="p-6 relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl border border-blue-100 bg-white flex-shrink-0 overflow-hidden shadow-sm">
                    <img src={getProductImage(activeRental.product)} alt="Product" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 leading-snug">{activeRental.product?.name}</h4>
                    <p className="text-xs text-indigo-600 font-bold mt-0.5 capitalize">{activeRental.product?.category}</p>
                    
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <p className="font-bold text-gray-400 uppercase tracking-wider">Start Date</p>
                        <p className="mt-1 font-bold text-gray-800">{formatDate(activeRental.startDate)}</p>
                      </div>
                      <div>
                        <p className="font-bold text-gray-400 uppercase tracking-wider">End Date</p>
                        <p className="mt-1 font-bold text-gray-800">{formatDate(activeRental.endDate)}</p>
                      </div>
                      <div>
                        <p className="font-bold text-gray-400 uppercase tracking-wider">Time Remaining</p>
                        <p className="mt-1 font-bold text-blue-600">{calculateDaysRemaining(activeRental.endDate)}</p>
                      </div>
                      {activeRental.order?.couponCode && (
                        <div>
                          <p className="font-bold text-rose-500 uppercase tracking-wider">Coupon Code</p>
                          <p className="mt-1 font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-1.5 py-0.5 inline-block font-mono">
                            {activeRental.order.couponCode}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start md:items-end justify-between gap-2 border-t md:border-t-0 border-blue-100/50 pt-4 md:pt-0">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Rental cost</span>
                  <span className="text-2xl font-extrabold text-blue-600">{formatCurrency(activeRental.totalPrice)}</span>
                  <Link
                    to="/my-rentals"
                    className="mt-2 inline-flex items-center justify-center px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-150 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-800">Ongoing Rental Status</h3>
            </div>
            
            <div className="p-6">
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 mb-4 font-semibold">You don't have any ongoing rentals right now.</p>
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                >
                  Start Renting
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { to: '/products', title: 'Browse Catalog', desc: 'Explore 100+ premium items', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', color: 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100/50' },
              { to: '/my-rentals', title: 'Rental History', desc: 'Track your rental orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2', color: 'bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100/50' },
              { to: '/wishlist', title: 'Wishlist', desc: 'View your saved items', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', color: 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100/50' }
            ].map((act, i) => (
              <Link
                key={i}
                to={act.to}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all flex items-center space-x-4 hover:-translate-y-0.5"
              >
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${act.color}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={act.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{act.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{act.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent History Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-base font-bold text-gray-800">Recent Transactions</h3>
            {rentalHistory.length > 0 && (
              <Link to="/my-rentals" className="text-xs text-blue-600 font-bold hover:underline">View All</Link>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {rentalHistory.map((historyItem) => {
                  const badge = getStatusBadge(historyItem.status);
                  return (
                    <tr key={historyItem.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
                            <img src={getProductImage(historyItem.product)} alt="Product" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-800">{historyItem.product?.name || 'N/A'}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-gray-400 font-medium capitalize">{historyItem.product?.category}</span>
                              {historyItem.order?.couponCode && (
                                <span className="text-[9px] bg-rose-50 text-rose-600 font-bold border border-rose-100 rounded px-1.5 py-0.2 font-mono">
                                  {historyItem.order.couponCode}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-700">
                          {formatDate(historyItem.startDate)} to {formatDate(historyItem.endDate)}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">{historyItem.totalDays} days</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800">
                        {historyItem.quantity || 1}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-gray-800">
                        {formatCurrency(historyItem.totalPrice)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.classes}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {rentalHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400 font-semibold bg-white">
                      You have not placed any rental orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;