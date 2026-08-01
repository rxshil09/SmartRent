import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('PAID'); // Default to PAID (orders awaiting approval)
  const [viewMode, setViewMode] = useState('table');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/rentals/orders');
      setOrders(response.data.items || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Updates parent Order status (e.g. confirming/cancelling entire checkout)
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setIsUpdating(true);
      await api.patch(`/rentals/orders/${orderId}/status`, { status: newStatus });
      await fetchOrders(); // Refresh list
      
      // Update selected order in state if modal is open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({
          ...prev,
          status: newStatus,
          rentals: prev.rentals.map(r => ({
            ...r,
            status: newStatus === 'CONFIRMED' ? 'CONFIRMED' : (newStatus === 'CANCELLED' ? 'CANCELLED' : r.status)
          }))
        }));
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Updates status of a specific item inside an order (e.g. marking individual item picked up/returned)
  const updateItemStatus = async (rentalId, newStatus) => {
    try {
      setIsUpdating(true);
      await api.patch(`/rentals/${rentalId}/status`, { status: newStatus });
      await fetchOrders(); // Refresh list
      
      // Refresh selected order modal data if open
      if (selectedOrder) {
        setSelectedOrder(prev => ({
          ...prev,
          rentals: prev.rentals.map(r => r.id === rentalId ? { ...r, status: newStatus } : r)
        }));
      }
    } catch (err) {
      console.error('Failed to update item status:', err);
      alert(err.response?.data?.message || 'Failed to update item status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGeneratePDF = async (rentalId) => {
    try {
      const response = await api.post(`/rentals/${rentalId}/generate-pdf`, {}, {
        responseType: 'blob', 
      });

      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rental_invoice_${rentalId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to generate PDF invoice. Please try again.');
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) return alert('No orders to export.');
    
    const headers = ['Order ID', 'Customer Name', 'Customer Email', 'Items Count', 'Fulfillment', 'Subtotal', 'Tax', 'Coupon', 'Total Paid', 'Status', 'Date'];
    
    const rows = orders.map(order => [
      order.id,
      order.userName,
      order.userEmail,
      order.rentals?.length || 0,
      order.fulfillmentMethod,
      order.subtotal,
      order.gstAmount,
      order.couponCode || 'None',
      order.totalAmount,
      order.status,
      new Date(order.createdAt).toLocaleDateString()
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `smartrent_parent_orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFilteredOrders = () => {
    if (filter === 'all') return orders;
    return orders.filter(order => order.status === filter);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'bg-amber-100 text-amber-800 border border-amber-200'; // PAID represents pending approval
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'PENDING_PAYMENT':
        return 'bg-gray-100 text-gray-600 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getItemStatusBadgeColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-700';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-700';
      case 'PICKED_UP':
        return 'bg-emerald-100 text-emerald-700';
      case 'RETURNED':
        return 'bg-gray-100 text-gray-600';
      case 'CANCELLED':
        return 'bg-red-100 text-red-600';
      case 'OVERDUE':
        return 'bg-rose-100 text-rose-700 animate-pulse';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const getStatusCounts = () => {
    return {
      total: orders.length,
      pendingApproval: orders.filter(o => o.status === 'PAID').length,
      confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
      cancelled: orders.filter(o => o.status === 'CANCELLED').length
    };
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 font-sans">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Order Approvals & Management</h1>
          <p className="mt-2 text-sm text-gray-600 font-medium">
            Review checkout orders, confirm bulk item approvals, and coordinate pick up / return schedules.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button 
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 focus:outline-none"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Export Orders (CSV)
          </button>
        </div>
      </div>

      {/* Orders Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Checkouts</p>
              <p className="text-xl font-extrabold text-gray-900 mt-0.5">{getStatusCounts().total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Approval</p>
              <p className="text-xl font-extrabold text-amber-600 mt-0.5">{getStatusCounts().pendingApproval}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Confirmed</p>
              <p className="text-xl font-extrabold text-emerald-600 mt-0.5">{getStatusCounts().confirmed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Sales</p>
              <p className="text-xl font-extrabold text-green-600 mt-0.5">
                {formatCurrency(orders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and View Tabs */}
      <div className="border-b border-gray-150 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Status Tab Navigation */}
        <nav className="flex space-x-8 overflow-x-auto w-full sm:w-auto">
          {[
            { filterVal: 'all', label: 'All Orders' },
            { filterVal: 'PAID', label: 'Pending Approval' },
            { filterVal: 'CONFIRMED', label: 'Confirmed' },
            { filterVal: 'CANCELLED', label: 'Cancelled' }
          ].map((item) => {
            const count = item.filterVal === 'all' ? orders.length : orders.filter(o => o.status === item.filterVal).length;
            const isActive = filter === item.filterVal;
            return (
              <button
                key={item.filterVal}
                onClick={() => setFilter(item.filterVal)}
                className={`py-4 px-1 border-b-2 font-bold text-xs whitespace-nowrap transition-colors uppercase tracking-wider ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
                }`}
              >
                {item.label} <span className="ml-1 text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{count}</span>
              </button>
            );
          })}
        </nav>

        {/* View Toggle */}
        <div className="flex border border-gray-200 rounded-xl bg-white p-0.5 shadow-sm">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-blue-600'
            }`}
          >
            Table View
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-blue-600'
            }`}
          >
            Cards View
          </button>
        </div>
      </div>

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {getFilteredOrders().map((order) => (
            <div 
              key={order.id} 
              className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900">Order #ORD-{order.id.slice(0, 6).toUpperCase()}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{order.userName}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeColor(order.status)}`}>
                    {order.status === 'PAID' ? 'Awaiting Approval' : order.status}
                  </span>
                </div>

                <div className="border-t border-gray-50 pt-3 mb-3 space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Rented Items ({order.rentals?.length || 0})</p>
                  {order.rentals?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-0.5">
                      <span className="font-bold text-gray-800 line-clamp-1 flex-1">{item.product?.name}</span>
                      <span className="text-gray-400 ml-2">x{item.quantity || 1}</span>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-gray-400 space-y-1 mb-3">
                  <p><span className="font-bold">Period:</span> {new Date(order.rentals[0]?.startDate).toLocaleDateString('en-IN')} - {new Date(order.rentals[0]?.endDate).toLocaleDateString('en-IN')}</p>
                  <p><span className="font-bold">Fulfillment:</span> {order.fulfillmentMethod === 'DELIVERY' ? 'Home Delivery' : 'Store Pickup'}</p>
                  {order.couponCode && <p className="text-rose-500 font-bold">Coupon: {order.couponCode}</p>}
                </div>
              </div>

              <div className="border-t border-gray-50 pt-3 flex justify-between items-center mt-3">
                <span className="text-base font-extrabold text-gray-900">{formatCurrency(order.totalAmount)}</span>
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold px-3 py-2 rounded-xl text-xs transition-colors border border-gray-100"
                >
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-xs">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Order Reference</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Rented Items</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Delivery Details</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Total Charge</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Order Status</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {getFilteredOrders().map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                      ORD-{order.id.slice(0, 6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-800">{order.userName}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{order.userEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[220px] space-y-1">
                        {order.rentals?.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="font-bold text-gray-700 line-clamp-1 flex-1">{item.product?.name}</span>
                            <span className="text-gray-400 font-semibold ml-2">x{item.quantity || 1}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-700">
                        {order.fulfillmentMethod === 'DELIVERY' ? 'Home Delivery' : 'Store Pickup'}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {order.rentals[0] ? `${new Date(order.rentals[0].startDate).toLocaleDateString('en-IN')} - ${new Date(order.rentals[0].endDate).toLocaleDateString('en-IN')}` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-gray-850">
                      <div>{formatCurrency(order.totalAmount)}</div>
                      {order.couponCode && (
                        <div className="text-[10px] text-rose-500 font-mono mt-0.5">Coupon: {order.couponCode}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeColor(order.status)}`}>
                        {order.status === 'PAID' ? 'Awaiting Approval' : order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-bold">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-xl transition-colors"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {getFilteredOrders().length === 0 && (
        <div className="bg-white shadow-sm rounded-2xl p-12 text-center border border-gray-150">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7" />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No matching orders found</h3>
          <p className="mt-1 text-xs text-gray-500">There are no orders matching the selected status filter.</p>
        </div>
      )}

      {/* Manage Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-4 bg-gray-500/75 backdrop-blur-sm">
          <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-150">
            {/* Modal Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-150 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Order Details</h3>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">Reference ID: ORD-{selectedOrder.id.toUpperCase()}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto space-y-5">
              {/* Grid split */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Customer Details</h4>
                  <div className="bg-gray-50 border border-gray-100 p-3 rounded-2xl">
                    <p className="text-sm font-bold text-gray-800">{selectedOrder.userName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedOrder.userEmail}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Fulfillment Information</h4>
                  <div className="bg-gray-50 border border-gray-100 p-3 rounded-2xl">
                    <p className="text-sm font-bold text-gray-800 capitalize">
                      {selectedOrder.fulfillmentMethod === 'DELIVERY' ? 'Home Delivery' : 'Store Pickup'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Status: <span className="font-semibold text-blue-600 capitalize">{selectedOrder.status.toLowerCase()}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Address if Home Delivery */}
              {selectedOrder.fulfillmentMethod === 'DELIVERY' && (
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Address</h4>
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-xs text-gray-600 space-y-1">
                    <p className="font-bold text-gray-800">{selectedOrder.userName}</p>
                    <p>{selectedOrder.addressLine1}</p>
                    {selectedOrder.addressLine2 && <p>{selectedOrder.addressLine2}</p>}
                    <p>{selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pincode}</p>
                  </div>
                </div>
              )}

              {/* Sub items management table */}
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Order Line Items</h4>
                <div className="border border-gray-100 rounded-2xl overflow-hidden text-xs">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-gray-400 font-bold">Product</th>
                        <th className="px-4 py-2.5 text-center text-gray-400 font-bold">Qty</th>
                        <th className="px-4 py-2.5 text-left text-gray-400 font-bold">Period</th>
                        <th className="px-4 py-2.5 text-center text-gray-400 font-bold">Item Status</th>
                        <th className="px-4 py-2.5 text-right text-gray-400 font-bold">Fulfillment Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {selectedOrder.rentals?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <p className="font-bold text-gray-800">{item.product?.name}</p>
                            <p className="text-[10px] text-gray-400 capitalize mt-0.5">{item.product?.category}</p>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-gray-700">{item.quantity || 1}</td>
                          <td className="px-4 py-3 text-gray-500 font-medium">
                            <p>{new Date(item.startDate).toLocaleDateString('en-IN')}</p>
                            <p className="text-[10px] text-gray-400">to {new Date(item.endDate).toLocaleDateString('en-IN')}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getItemStatusBadgeColor(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {/* Individual Item logistics action triggers (only if parent order is confirmed) */}
                            {selectedOrder.status === 'CONFIRMED' && (
                              <div className="flex gap-1.5 justify-end">
                                {['CONFIRMED', 'PENDING'].includes(item.status) && (
                                  <button
                                    onClick={() => updateItemStatus(item.id, 'PICKED_UP')}
                                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-emerald-100"
                                  >
                                    Picked Up
                                  </button>
                                )}
                                {item.status === 'PICKED_UP' && (
                                  <button
                                    onClick={() => updateItemStatus(item.id, 'RETURNED')}
                                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-purple-100"
                                  >
                                    Returned
                                  </button>
                                )}
                                {['RETURNED', 'CANCELLED'].includes(item.status) && (
                                  <span className="text-[10px] text-gray-400 font-bold">Finalized</span>
                                )}
                              </div>
                            )}
                            {selectedOrder.status === 'PAID' && (
                              <span className="text-[10px] text-gray-400 font-bold">Awaiting Approval</span>
                            )}
                            {selectedOrder.status === 'CANCELLED' && (
                              <span className="text-[10px] text-red-500 font-bold">Cancelled</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoice Generation & PDF downloads */}
              <div className="border-t border-gray-50 pt-4 flex justify-between items-center">
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tax Invoice</h4>
                  <p className="text-[10px] text-gray-400">Generate full order PDF layout invoice</p>
                </div>
                <button
                  onClick={() => handleGeneratePDF(selectedOrder.rentals[0]?.id)}
                  disabled={!selectedOrder.rentals || selectedOrder.rentals.length === 0}
                  className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5" />
                  </svg>
                  Generate Invoice PDF
                </button>
              </div>

              {/* Billing Summary Box */}
              <div className="border-t border-gray-50 pt-4 space-y-2">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order Receipt Summary</h4>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-1.5 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-bold text-gray-800">{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charge:</span>
                    <span className="font-bold text-gray-800">{selectedOrder.deliveryFee === 0 ? 'FREE' : formatCurrency(selectedOrder.deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST Tax (18%):</span>
                    <span className="font-bold text-gray-800">{formatCurrency(selectedOrder.gstAmount)}</span>
                  </div>
                  {selectedOrder.couponDiscount > 0 && (
                    <div className="flex justify-between text-rose-600 font-semibold">
                      <span>Discount Coupon ({selectedOrder.couponCode}):</span>
                      <span>−{formatCurrency(selectedOrder.couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-extrabold text-blue-600">
                    <span>Total Paid:</span>
                    <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions (Awaiting Approval State actions) */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-2.5">
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 shadow-sm"
              >
                Close View
              </button>

              {selectedOrder.status === 'PAID' && (
                <>
                  <button
                    disabled={isUpdating}
                    onClick={() => updateOrderStatus(selectedOrder.id, 'CANCELLED')}
                    className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2.5 rounded-xl text-xs font-bold border border-red-100 transition-colors disabled:opacity-50"
                  >
                    Reject & Cancel
                  </button>
                  <button
                    disabled={isUpdating}
                    onClick={() => updateOrderStatus(selectedOrder.id, 'CONFIRMED')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
                  >
                    Confirm & Approve Order
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;
