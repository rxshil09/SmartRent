import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import { useCart } from '../../../../contexts/CartContext';
import CustomerNav from '../../../../components/CustomerNav';
import api from '../../../../lib/api';

const ReviewOrderPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const {
    cart,
    fulfillmentMethod,
    couponCode,
    couponDiscount,
    subtotal,
    gstAmount,
    deliveryFee,
    totalAmount,
    clearCart,
    calculateDays
  } = useCart();

  const [addressDetails, setAddressDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatCurrency = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;
  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/products');
      return;
    }

    const savedAddress = localStorage.getItem('sr_address');
    if (!savedAddress) {
      navigate('/checkout/delivery');
      return;
    }

    setAddressDetails(JSON.parse(savedAddress));
  }, [cart, navigate]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
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

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Create Reservation on Backend (Stock lock, Order in PENDING_PAYMENT status)
      const reservePayload = {
        items: cart.map(item => ({
          productId: item.id,
          startDate: item.startDate,
          endDate: item.endDate,
          notes: item.notes,
          quantity: item.quantity || 1
        })),
        fulfillmentMethod,
        addressLine1: addressDetails.deliveryAddress.addressLine1,
        addressLine2: addressDetails.deliveryAddress.addressLine2,
        city: addressDetails.deliveryAddress.city,
        state: addressDetails.deliveryAddress.state,
        pincode: addressDetails.deliveryAddress.pincode,
        couponCode: couponCode || null
      };

      const reserveResponse = await api.post('/rentals/reserve', reservePayload);
      const { orderId } = reserveResponse.data;

      // 2. Create Razorpay order linking to the reservation
      const orderResponse = await api.post('/payments/razorpay/order', { orderId });
      const orderData = orderResponse.data;

      // 3. Load Razorpay checkout window
      const scriptLoaded = await loadRazorpay();
      if (!scriptLoaded) {
        setError('Unable to load payment gateway. Please try again.');
        setLoading(false);
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'SmartRent',
        description: 'Rental Payment',
        order_id: orderData.orderId,
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: addressDetails.deliveryAddress.phoneNumber
        },
        modal: {
          ondismiss: () => {
            setError('Payment cancelled by user. The reserved stock will release automatically after 5 minutes.');
            setLoading(false);
          }
        },
        handler: async (response) => {
          try {
            // 4. Verify Payment on Backend
            const verifyPayload = {
              orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            };

            await api.post('/payments/razorpay/verify', verifyPayload);

            // Clear cart and stored values on success
            clearCart();
            localStorage.removeItem('sr_address');

            navigate('/checkout/success', {
              state: {
                orderId,
                totalAmount
              }
            });
          } catch (err) {
            console.error('Payment verification failed:', err);
            setError(err.response?.data?.message || 'Payment verification failed. Please contact support.');
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
      console.error('Reservation/Payment initiation failed:', err);
      setError(err.response?.data?.message || 'Failed to initialize reservation or payment.');
      setLoading(false);
    }
  };

  if (cart.length === 0 || !addressDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <CustomerNav />

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4 text-xs font-semibold">
            <span className="text-gray-400">Review Order</span>
            <span className="text-gray-300">›</span>
            <span className="text-gray-400">Delivery Method & Address</span>
            <span className="text-gray-300">›</span>
            <span className="text-blue-600">Final Confirmation & Pay</span>
          </div>
        </div>
      </div>

      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Order Details & Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items Summary Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Order Items</h2>
              <div className="divide-y divide-gray-100">
                {cart.map((item) => {
                  const days = calculateDays(item.startDate, item.endDate);
                  return (
                    <div key={item.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="flex items-center space-x-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 rounded-xl object-cover border border-gray-150"
                          onError={(e) => {
                            e.target.src = `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" fill="#E5E7EB"/><text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="#6B7280" font-family="Arial, sans-serif" font-size="30" font-weight="bold">${item.name?.charAt(0) || 'P'}</text></svg>`)}`;
                          }}
                        />
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                          <p className="text-xs text-gray-500">{item.brand} ({days} days)</p>
                          <p className="text-xs text-gray-400 font-medium">Rental Period: {formatDate(item.startDate)} to {formatDate(item.endDate)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-950">{formatCurrency(item.pricePerDay * days)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Address Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Delivery & Billing Info</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-bold text-gray-600 uppercase text-xs mb-2">Fulfillment Details ({fulfillmentMethod})</h4>
                  {fulfillmentMethod === 'DELIVERY' ? (
                    <div className="text-gray-900 space-y-1">
                      <p className="font-semibold">{addressDetails.deliveryAddress.fullName}</p>
                      <p>{addressDetails.deliveryAddress.addressLine1}</p>
                      {addressDetails.deliveryAddress.addressLine2 && <p>{addressDetails.deliveryAddress.addressLine2}</p>}
                      <p>{addressDetails.deliveryAddress.city}, {addressDetails.deliveryAddress.state} - {addressDetails.deliveryAddress.pincode}</p>
                      <p className="font-medium text-xs mt-2 text-gray-500">Contact: {addressDetails.deliveryAddress.phoneNumber}</p>
                    </div>
                  ) : (
                    <div className="text-gray-900">
                      <p className="font-semibold">Self-Pickup at SmartRent HQ</p>
                      <p>SmartRent Central Warehouse, Bangalore, Karnataka</p>
                      <p className="text-xs text-gray-500 mt-2">Bring a government-issued photo ID for validation at store pickup.</p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-gray-600 uppercase text-xs mb-2">Billing Details</h4>
                  <div className="text-gray-900 space-y-1">
                    <p className="font-semibold">{addressDetails.invoiceAddress.fullName}</p>
                    <p>{addressDetails.invoiceAddress.addressLine1}</p>
                    {addressDetails.invoiceAddress.addressLine2 && <p>{addressDetails.invoiceAddress.addressLine2}</p>}
                    <p>{addressDetails.invoiceAddress.city}, {addressDetails.invoiceAddress.state} - {addressDetails.invoiceAddress.pincode}</p>
                    <p className="font-medium text-xs mt-2 text-gray-500">Contact: {addressDetails.invoiceAddress.phoneNumber}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Proceed Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6 sticky top-6">
              <h3 className="text-base font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Final Summary</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charge</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST Tax (18%)</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(gstAmount)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Coupon Discount</span>
                    <span>-{formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-150 pt-3 flex justify-between text-base font-extrabold text-gray-900">
                  <span>Total Amount</span>
                  <span className="text-green-600 text-lg">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 leading-relaxed">
                  {error}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3.5 px-6 rounded-xl font-bold transition-all shadow-md hover:shadow-lg text-sm flex justify-center items-center"
                >
                  {loading ? 'Initiating Gateways...' : `Pay ${formatCurrency(totalAmount)}`}
                </button>
                <button
                  onClick={() => navigate('/checkout/delivery')}
                  disabled={loading}
                  className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-bold transition-colors text-xs"
                >
                  Back to Delivery Address
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewOrderPage;
