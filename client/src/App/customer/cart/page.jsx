import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../../contexts/CartContext';
import CustomerNav from '../../../components/CustomerNav';

const CartPage = () => {
  const navigate = useNavigate();
  const {
    cart,
    removeFromCart,
    fulfillmentMethod,
    setFulfillmentMethod,
    couponCode,
    setCouponCode,
    couponDiscount,
    subtotal,
    gstAmount,
    deliveryFee,
    totalAmount,
    clearCart,
    calculateDays,
    updateCartItemQuantity
  } = useCart();

  const [couponInput, setCouponInput] = useState(couponCode);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(!!couponCode);

  const formatCurrency = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;
  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const validCoupons = { SAVE10: '10% off', FIRST50: '₹50 off', WELCOME: '5% off', FESTIVE20: '20% off' };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const code = couponInput.toUpperCase().trim();
    if (validCoupons[code]) {
      setCouponCode(code);
      setCouponSuccess(true);
      setCouponError('');
    } else {
      setCouponError('Invalid coupon code. Try: SAVE10, FESTIVE20, WELCOME');
      setCouponSuccess(false);
      setCouponCode('');
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponInput('');
    setCouponSuccess(false);
    setCouponError('');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <CustomerNav />
        <div className="flex-grow flex items-center justify-center py-16 px-4">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center max-w-md w-full">
            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 text-sm mb-8">Browse our catalog to find premium equipment for your next project.</p>
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <CustomerNav />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Rental Cart</h1>
            <p className="text-sm text-gray-500 mt-0.5">{cart.length} item{cart.length !== 1 ? 's' : ''} selected</p>
          </div>
          <button
            onClick={clearCart}
            className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors flex items-center gap-1.5 border border-red-100 hover:border-red-300 px-3 py-1.5 rounded-xl"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Cart Items + Fulfillment */}
          <div className="lg:col-span-2 space-y-4">
            {/* Continue Shopping */}
            <div className="flex mb-1">
              <Link
                to="/products"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
                Continue Shopping
              </Link>
            </div>

            {/* Items */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="text-base font-bold text-gray-800">Items</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {cart.map((item) => {
                  const days = calculateDays(item.startDate, item.endDate);
                  const itemQty = item.quantity || 1;
                  const lineTotal = item.pricePerDay * days * itemQty;
                  return (
                    <div key={item.id} className="p-5 flex items-start gap-4">
                      {/* Image */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" fill="#F3F4F6"/><text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="#9CA3AF" font-family="Arial" font-size="24" font-weight="bold">${item.name?.charAt(0) || 'P'}</text></svg>`)}`;
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-gray-900 text-sm leading-tight">{item.name}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{item.category}{item.brand ? ` • ${item.brand}` : ''}</p>
                          </div>
                          <span className="text-sm font-extrabold text-gray-900 whitespace-nowrap">{formatCurrency(lineTotal)}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-4">
                          <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg font-medium">
                            {formatDate(item.startDate)} – {formatDate(item.endDate)}
                          </span>
                          <span className="text-xs text-blue-600 font-semibold">{days} day{days !== 1 ? 's' : ''}</span>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg mt-2 inline-block font-medium">
                            Note: {item.notes}
                          </p>
                        )}
                        <div className="mt-3 flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 font-medium">Qty:</span>
                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                              <button
                                type="button"
                                disabled={itemQty <= 1}
                                onClick={() => updateCartItemQuantity(item.id, itemQty - 1)}
                                className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold disabled:opacity-50 transition-colors"
                              >
                                −
                              </button>
                              <span className="px-2 text-xs font-bold text-gray-800 bg-white border-x border-gray-200 h-7 flex items-center min-w-[24px] justify-center">
                                {itemQty}
                              </span>
                              <button
                                type="button"
                                disabled={itemQty >= (item.availableStock || 10)}
                                onClick={() => updateCartItemQuantity(item.id, itemQty + 1)}
                                className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold disabled:opacity-50 transition-colors"
                              >
                                +
                              </button>
                            </div>
                            {item.availableStock > 0 && itemQty >= item.availableStock && (
                              <span className="text-[10px] text-amber-600 font-semibold">Max stock reached</span>
                            )}
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fulfillment Method */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-base font-bold text-gray-800 mb-4">Fulfillment Method</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'PICKUP', label: 'Store Pickup', desc: 'Free • Bring ID to store', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
                  { id: 'DELIVERY', label: 'Home Delivery', desc: '₹99 • Delivered to door', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
                ].map(({ id, label, desc, icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFulfillmentMethod(id)}
                    className={`p-4 border-2 rounded-xl flex flex-col items-center text-center transition-all ${
                      fulfillmentMethod === id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-100 text-gray-600 hover:border-gray-200 bg-gray-50'
                    }`}
                  >
                    <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                    </svg>
                    <span className="text-sm font-bold">{label}</span>
                    <span className="text-xs mt-0.5 opacity-70">{desc}</span>
                    {fulfillmentMethod === id && (
                      <div className="mt-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
              <h3 className="text-base font-bold text-gray-800 mb-5">Order Summary</h3>

              {/* Price Breakdown */}
              <div className="space-y-3 text-sm pb-4 border-b border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cart.length} items)</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className={`font-semibold ${deliveryFee === 0 ? 'text-emerald-600' : 'text-gray-800'}`}>
                    {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST (18%)</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(gstAmount)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon ({couponCode})</span>
                    <span>−{formatCurrency(couponDiscount)}</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-4 mb-5">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-2xl font-extrabold text-blue-600">{formatCurrency(totalAmount)}</span>
              </div>

              {/* Coupon */}
              <div className="mb-5">
                {!couponSuccess ? (
                  <form onSubmit={handleApplyCoupon}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Coupon code"
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value); setCouponError(''); }}
                        className="flex-grow px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 font-mono uppercase"
                      />
                      <button
                        type="submit"
                        className="bg-blue-600 text-white font-bold text-xs px-4 rounded-xl hover:bg-blue-700 transition-colors whitespace-nowrap"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && <p className="text-xs text-red-500 mt-1.5 font-medium">{couponError}</p>}
                    <p className="text-xs text-gray-400 mt-1.5">Try: SAVE10, FESTIVE20, WELCOME</p>
                  </form>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-800">{couponCode}</p>
                        <p className="text-xs text-emerald-600">{validCoupons[couponCode]} applied</p>
                      </div>
                    </div>
                    <button onClick={handleRemoveCoupon} className="text-red-400 hover:text-red-600 transition-colors text-xs font-semibold">
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={() => navigate('/checkout/delivery')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3.5 px-6 rounded-xl font-bold transition-all shadow-md hover:shadow-lg text-sm flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CartPage;
