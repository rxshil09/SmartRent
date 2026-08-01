import React, { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import CustomerNav from '../../../../components/CustomerNav';

const CheckoutSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const orderId = location.state?.orderId;
  const totalAmount = location.state?.totalAmount;

  useEffect(() => {
    if (!orderId) {
      navigate('/products');
    }
  }, [orderId, navigate]);

  const formatCurrency = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <CustomerNav />

      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-150 p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-50 text-green-600 mb-6">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Order Confirmed!</h1>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Thank you for choosing SmartRent. Your reservation has been booked and stock locks confirmed. We have sent a notification email to your registered address.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left text-sm space-y-2.5">
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Order ID:</span>
              <span className="font-bold text-gray-900">#{orderId.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Paid Amount:</span>
              <span className="font-bold text-green-600">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Order Status:</span>
              <span className="font-bold text-blue-600">PENDING APPROVAL</span>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              to="/my-rentals"
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              Go to My Rentals
            </Link>
            <Link
              to="/products"
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckoutSuccessPage;
