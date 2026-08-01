import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../lib/api';
import CustomerNav from '../../../../components/CustomerNav';

const PaymentPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [cartItem, setCartItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const item = location.state?.cartItem || JSON.parse(localStorage.getItem('pendingRental') || 'null');
    if (!item || !item.deliveryAddress) {
      navigate('/products');
      return;
    }
    setCartItem(item);
  }, [location.state, navigate]);

  const loadRazorpay = () => {
    return new Promise(resolve => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayNow = async () => {
    setLoading(true);
    setError('');

    const finalTotal = cartItem.finalTotal || cartItem.pricing.total;

    try {
      // Create Razorpay order on backend
      const { data } = await api.post('/payments/razorpay/order', { amount: finalTotal });

      const scriptLoaded = await loadRazorpay();
      if (!scriptLoaded) {
        setError('Unable to load payment gateway. Please try again.');
        setLoading(false);
        return;
      }

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'SmartRent',
        description: 'Rental Payment',
        order_id: data.orderId,
        prefill: { name: user?.name, email: user?.email },
        modal: {
          ondismiss: () => {
            setError('Payment cancelled by user.');
            setLoading(false);
          }
        },
        handler: async (response) => {
          try {
            // Place order with rental service
            const rentalData = {
              productId: cartItem.product.id,
              startDate: cartItem.startDate,
              endDate: cartItem.endDate,
              notes: cartItem.notes || '',
              paymentMethod: 'razorpay',
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              deliveryAddress: cartItem.deliveryAddress,
              invoiceAddress: cartItem.invoiceAddress,
              deliveryMethod: cartItem.deliveryMethod,
              appliedCoupon: cartItem.appliedCoupon,
              finalTotal: finalTotal
            };

            const rentalResponse = await api.post('/rentals', rentalData);
            localStorage.removeItem('pendingRental');
            
            navigate('/checkout/success', {
              state: {
                rental: rentalResponse.data.rental,
                orderDetails: cartItem
              }
            });
          } catch (err) {
            console.error('Failed to create rental order:', err);
            setError(err.response?.data?.message || 'Payment was successful, but failed to create rental order. Please contact support.');
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setError(resp.error?.description || 'Payment failed. Please try again.');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Payment initiation failed:', err);
      setError(err.response?.data?.message || 'Failed to initiate payment gateway.');
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  if (!cartItem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const finalTotal = cartItem.finalTotal || cartItem.pricing.total;
  const couponDiscount = cartItem.appliedCoupon
    ? (cartItem.appliedCoupon.type === 'percentage'
        ? Math.round(cartItem.pricing.subtotal * cartItem.appliedCoupon.discount / 100)
        : cartItem.appliedCoupon.discount)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <CustomerNav />

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4 text-xs font-semibold">
            <span className="text-gray-400">Review Order</span>
            <span className="text-gray-300">›</span>
            <span className="text-gray-400">Delivery</span>
            <span className="text-gray-300">›</span>
            <span className="text-blue-600">Payment</span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Payment Main Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="text-center py-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h2 className="mt-3 text-lg font-bold text-gray-900">Secure Payment Checkout</h2>
            <p className="mt-1 text-sm text-gray-500">We partner with Razorpay to offer secure, frictionless payments via UPI, Card, NetBanking, and Wallets.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-xs">
              {error}
            </div>
          )}

          {/* Pricing Breakdown */}
          <div className="border-t border-b border-gray-100 py-4 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Rented Product:</span>
              <span className="font-semibold text-gray-900">{cartItem.product?.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Rental Duration:</span>
              <span className="font-semibold text-gray-900">{cartItem.pricing.totalDays} days</span>
            </div>
            <div className="flex justify-between">
              <span>Base Subtotal:</span>
              <span className="font-semibold text-gray-900">{formatCurrency(cartItem.pricing.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charge:</span>
              <span className="font-semibold text-gray-900">
                {cartItem.pricing.deliveryCharge === 0 ? 'Free' : formatCurrency(cartItem.pricing.deliveryCharge)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>GST Tax (18%):</span>
              <span className="font-semibold text-gray-900">{formatCurrency(cartItem.pricing.taxes)}</span>
            </div>
            {cartItem.appliedCoupon && (
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Coupon Applied ({cartItem.appliedCoupon.code}):</span>
                <span>-{formatCurrency(couponDiscount)}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-extrabold text-gray-900">
              <span>Total Payable Amount</span>
              <span className="text-green-600 text-lg">{formatCurrency(finalTotal)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handlePayNow}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-bold transition-colors text-sm flex justify-center items-center"
            >
              {loading ? 'Processing Transaction...' : 'Pay with Razorpay'}
            </button>
            <button
              onClick={() => navigate('/checkout/delivery')}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 py-2 rounded-lg font-bold transition-colors text-xs"
            >
              ← Back to Delivery
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
