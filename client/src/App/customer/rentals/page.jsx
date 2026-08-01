import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../lib/api';
import CustomerNav from '../../../components/CustomerNav';

const RentalsPage = () => {
  const [activeRental, setActiveRental] = useState(null);
  const [rentalHistory, setRentalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [activeResponse, historyResponse] = await Promise.all([
        api.get('/rentals/active').catch(() => ({ data: { rental: null } })),
        api.get('/rentals/my-rentals').catch(() => ({ data: { items: [] } }))
      ]);

      setActiveRental(activeResponse.data.rental);
      setRentalHistory(historyResponse.data.items || []);
    } catch (err) {
      console.error('Failed to fetch rental history:', err);
      setError('Failed to load rentals history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (rentalId) => {
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
      console.error('Failed to download invoice PDF:', err);
      alert('Failed to download invoice PDF. Please try again.');
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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Your Rentals</h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">Track your active rentals and view complete order history.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-semibold">{error}</div>
        )}
        
        {/* Section 1: Active/Ongoing Rental */}
        {activeRental ? (
          <div className="bg-gradient-to-br from-blue-50/75 via-indigo-50/40 to-white border border-blue-100 rounded-2xl shadow-sm overflow-hidden relative">
            <div className="px-6 py-4 border-b border-blue-100/50 bg-blue-50/30 flex justify-between items-center relative z-10">
              <h2 className="text-sm font-extrabold tracking-wider uppercase text-blue-700">Ongoing Rental Order</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(activeRental.status).classes}`}>
                {getStatusBadge(activeRental.status).label}
              </span>
            </div>
            <div className="p-6 relative z-10">
              <div className="flex flex-col lg:flex-row gap-6 justify-between items-stretch">
                {/* List all items in the order */}
                <div className="flex flex-col flex-grow divide-y divide-blue-50 pr-0 lg:pr-6">
                  {(activeRental.order?.rentals || [activeRental]).map((item, idx) => (
                    <div key={item.id || idx} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="w-16 h-16 bg-white rounded-xl border border-blue-100 overflow-hidden flex-shrink-0 shadow-sm">
                        <img src={getProductImage(item.product)} alt="Product" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-base font-bold text-gray-900 leading-snug">{item.product?.name}</h3>
                        <p className="text-xs text-indigo-600 font-bold mt-0.5 capitalize">{item.product?.category}</p>
                        
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                          <div>
                            <p className="font-bold text-gray-400 uppercase tracking-wider">Start Date</p>
                            <p className="text-xs font-bold text-gray-800 mt-0.5">{formatDate(item.startDate)}</p>
                          </div>
                          <div>
                            <p className="font-bold text-gray-400 uppercase tracking-wider">End Date</p>
                            <p className="text-xs font-bold text-gray-800 mt-0.5">{formatDate(item.endDate)}</p>
                          </div>
                          <div>
                            <p className="font-bold text-gray-400 uppercase tracking-wider">Duration</p>
                            <p className="text-xs font-bold text-gray-800 mt-0.5">{item.totalDays} day{item.totalDays !== 1 ? 's' : ''}</p>
                          </div>
                          <div>
                            <p className="font-bold text-gray-400 uppercase tracking-wider">Quantity</p>
                            <p className="text-xs font-bold text-gray-800 mt-0.5">{item.quantity || 1} unit{(item.quantity || 1) !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-950">{formatCurrency(item.totalPrice)}</p>
                        <span className="text-[10px] text-gray-400 font-bold">{formatCurrency(item.pricePerDay)}/day</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Billing Summary & Actions */}
                <div className="flex flex-col justify-between items-start lg:items-end border-t lg:border-t-0 lg:border-l border-blue-100/50 pt-4 lg:pt-0 lg:pl-6 min-w-[260px] flex-shrink-0">
                  <div className="lg:text-right w-full space-y-2">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Order Summary</p>
                    {activeRental.order ? (
                      <div className="space-y-1.5 text-xs font-semibold text-gray-500 w-full">
                        <div className="flex justify-between gap-4">
                          <span>Subtotal:</span>
                          <span className="text-gray-800 font-bold">{formatCurrency(activeRental.order.subtotal)}</span>
                        </div>
                        {Number(activeRental.order.couponDiscount) > 0 && (
                          <div className="flex justify-between gap-4 text-rose-600">
                            <span>Discount ({activeRental.order.couponCode}):</span>
                            <span className="font-bold">-{formatCurrency(activeRental.order.couponDiscount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between gap-4">
                          <span>GST Tax (18%):</span>
                          <span className="text-gray-800 font-bold">{formatCurrency(activeRental.order.gstAmount)}</span>
                        </div>
                        {Number(activeRental.order.deliveryFee) > 0 && (
                          <div className="flex justify-between gap-4">
                            <span>Delivery:</span>
                            <span className="text-gray-800 font-bold">{formatCurrency(activeRental.order.deliveryFee)}</span>
                          </div>
                        )}
                        <div className="border-t border-blue-100 pt-2 mt-2 flex justify-between gap-4 text-sm font-extrabold text-blue-600">
                          <span>Total Paid:</span>
                          <span className="text-base">{formatCurrency(activeRental.order.totalAmount)}</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-3xl font-extrabold text-blue-600 mt-1">{formatCurrency(activeRental.totalPrice)}</p>
                        <span className="text-[10px] text-gray-400 font-bold">Rate: {formatCurrency(activeRental.pricePerDay)}/day</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 w-full flex justify-end">
                    <button
                      onClick={() => handleDownloadPDF(activeRental.id)}
                      className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Invoice
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-150 bg-gray-50/50 flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-800">Ongoing Rental</h2>
            </div>
            <div className="p-6">
              <div className="text-center py-10">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 mb-5 font-semibold">You don't have any ongoing rentals at the moment.</p>
                <Link
                  to="/products"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-sm hover:shadow-md inline-block"
                >
                  Browse Catalog
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: History List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
            <h2 className="text-base font-bold text-gray-800">Rental History</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50/65">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Period / Duration</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Total Paid</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {rentalHistory.map((rental) => {
                  const badge = getStatusBadge(rental.status);
                  return (
                    <tr key={rental.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
                            <img src={getProductImage(rental.product)} alt="Product" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-800">{rental.product?.name || 'Unknown Product'}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400 font-medium capitalize">{rental.product?.category}</span>
                              {rental.order?.couponCode && (
                                <span className="text-[10px] bg-rose-50 text-rose-600 font-bold border border-rose-100 rounded px-1.5 py-0.2 font-mono">
                                  {rental.order.couponCode}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-800">
                          {formatDate(rental.startDate)} – {formatDate(rental.endDate)}
                        </div>
                        <div className="text-xs text-gray-400 font-medium mt-0.5">{rental.totalDays} day{rental.totalDays !== 1 ? 's' : ''}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800">
                        {rental.quantity || 1}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-gray-800">
                        {formatCurrency(rental.totalPrice)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.classes}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-bold space-x-2">
                        <button
                          onClick={() => handleDownloadPDF(rental.id)}
                          className="bg-gray-150 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl transition-colors font-bold"
                        >
                          Invoice
                        </button>
                        {['RETURNED', 'CANCELLED'].includes(rental.status) && rental.product?.id && (
                          <Link
                            to={`/products/${rental.product.id}`}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-xl transition-colors font-bold inline-block"
                          >
                            Rent Again
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rentalHistory.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-semibold bg-white">
                      You have no past rental transactions.
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

export default RentalsPage;