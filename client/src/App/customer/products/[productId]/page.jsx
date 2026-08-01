import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWishlist } from '../../../../contexts/WishlistContext';
import { useCart } from '../../../../contexts/CartContext';
import api from '../../../../lib/api';
import CustomerNav from '../../../../components/CustomerNav';

const ProductDetailsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { addToCart } = useCart();
  
  // Product and rental state
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Rental form state
  const [rentalForm, setRentalForm] = useState({
    startDate: '',
    endDate: '',
    notes: ''
  });
  
  // Calculated pricing
  const [pricing, setPricing] = useState({
    totalDays: 0,
    pricePerDay: 0,
    subtotal: 0,
    deliveryCharge: 0,
    taxes: 0,
    total: 0
  });
  
  // UI state
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showDateValidation, setShowDateValidation] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await api.get(`/products/${productId}`);
        setProduct(response.data.product);
      } catch (err) {
        console.error('Failed to fetch product:', err);
        setError('Product not found');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  useEffect(() => {
    const calculatePricing = () => {
      if (!product || !rentalForm.startDate || !rentalForm.endDate) {
        setPricing({
          totalDays: 0,
          pricePerDay: 0,
          subtotal: 0,
          deliveryCharge: 0,
          taxes: 0,
          total: 0
        });
        return;
      }

      const startDate = new Date(rentalForm.startDate);
      const endDate = new Date(rentalForm.endDate);
      
      // Inclusive days calculation: Aug 1 to Aug 2 is 2 days
      const diffTime = endDate - startDate;
      const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      
      const pricePerDay = product.pricePerDay;
      const subtotal = totalDays * pricePerDay * quantity;
      const deliveryCharge = 99; // Standard estimated delivery charge shown upfront
      const taxRate = 0.18; // Correct 18% GST rate for rental services in India
      const taxes = Math.round(subtotal * taxRate);
      const total = subtotal + deliveryCharge + taxes;

      setPricing({
        totalDays,
        pricePerDay,
        subtotal,
        deliveryCharge,
        taxes,
        total
      });
    };

    calculatePricing();
  }, [rentalForm.startDate, rentalForm.endDate, product, quantity]);

  const handleFormChange = (field, value) => {
    setRentalForm(prev => ({
      ...prev,
      [field]: value
    }));
    setShowDateValidation(false);
  };

  const validateDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(rentalForm.startDate);
    const endDate = new Date(rentalForm.endDate);

    if (startDate < today) {
      setError('Start date cannot be in the past');
      return false;
    }

    if (endDate < startDate) {
      setError('End date must be on or after start date');
      return false;
    }

    if (pricing.totalDays > 30) {
      setError('Maximum rental period is 30 days');
      return false;
    }

    setError('');
    return true;
  };

  const handleProceedToCheckout = () => {
    if (!rentalForm.startDate || !rentalForm.endDate) {
      setShowDateValidation(true);
      setError('Please select rental dates');
      return;
    }

    if (!validateDates()) {
      return;
    }

    setIsRedirecting(true);
    addToCart(product, rentalForm.startDate, rentalForm.endDate, rentalForm.notes, quantity);
    navigate('/cart');
  };

  const handleWishlist = () => {
    if (product) {
      toggleWishlist(product);
    }
  };

  const getProductImage = (product, index = 0) => {
    if (product?.images && product.images.length > index) {
      return product.images[index];
    }
    return `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none"><rect width="600" height="400" fill="#E5E7EB"/><text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="#6B7280" font-family="Arial, sans-serif" font-size="120" font-weight="bold">${product?.name?.charAt(0) || 'P'}</text></svg>`)}`;
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 90); // Max booking window 90 days out
    return date.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <CustomerNav />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <CustomerNav />

      {/* Breadcrumbs Navigation */}
      <div className="bg-white border-b border-gray-200 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/products')}
            className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            ← Back to Products
          </button>
          <span className="text-xs text-gray-500 font-medium">Category: <span className="text-gray-900 font-semibold uppercase">{product?.category}</span></span>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          
          {/* Left Column: Product Image & Details */}
          <div className="mb-8 lg:mb-0 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <img
                src={getProductImage(product)}
                alt={product?.name}
                className="w-full h-96 object-cover"
                onError={(e) => {
                  e.target.src = getProductImage(product);
                }}
              />
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={handleWishlist}
                  className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg font-bold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 text-sm"
                >
                  <svg
                    className={`w-5 h-5 ${isWishlisted(product?.id) ? 'text-red-500 fill-current' : ''}`}
                    fill={isWishlisted(product?.id) ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{isWishlisted(product?.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}</span>
                </button>
              </div>
            </div>

            {/* Product Meta */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">About this Product</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {product?.description || 'No description available for this product.'}
              </p>
              
              <div className="mt-6 border-t border-gray-100 pt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
                {product?.brand && <div><strong>Brand:</strong> {product.brand}</div>}
                {product?.model && <div><strong>Model:</strong> {product.model}</div>}
                {product?.condition && <div><strong>Condition:</strong> {product.condition}</div>}
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Form & Pricing Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{product?.name}</h1>
              <div className="flex items-baseline space-x-2 mb-6">
                <span className="text-3xl font-extrabold text-green-600">
                  {formatCurrency(product?.pricePerDay || 0)}
                </span>
                <span className="text-gray-500 font-medium">/day</span>
                <span className="text-xs text-gray-400 ml-2">({product?.availableStock || 0} units left in stock)</span>
              </div>

              {/* Rental Input Form */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Rental Duration</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Start Date</label>
                      <input
                        type="date"
                        value={rentalForm.startDate}
                        onChange={(e) => handleFormChange('startDate', e.target.value)}
                        min={getMinDate()}
                        max={getMaxDate()}
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          showDateValidation && !rentalForm.startDate ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">End Date</label>
                      <input
                        type="date"
                        value={rentalForm.endDate}
                        onChange={(e) => handleFormChange('endDate', e.target.value)}
                        min={rentalForm.startDate || getMinDate()}
                        max={getMaxDate()}
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          showDateValidation && !rentalForm.endDate ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Rent for up to 30 days. Pricing counts start and end date inclusively.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Quantity</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center text-lg font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      min={1}
                      max={product?.availableStock || 1}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(parseInt(e.target.value) || 1, product?.availableStock || 1));
                        setQuantity(val);
                      }}
                      className="w-16 h-10 border border-gray-300 rounded-lg text-center font-bold text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      disabled={quantity >= (product?.availableStock || 1)}
                      onClick={() => setQuantity(prev => Math.min(product?.availableStock || 1, prev + 1))}
                      className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center text-lg font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Fulfillment Instructions (Optional)</label>
                  <textarea
                    value={rentalForm.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter any special requests (e.g. delivery instructions)..."
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleProceedToCheckout}
                  disabled={isRedirecting || (product?.availableStock || 0) < 1}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2 text-sm"
                >
                  {isRedirecting ? (
                    <span>Adding to Cart...</span>
                  ) : (product?.availableStock || 0) < 1 ? (
                    <span>Out of Stock</span>
                  ) : (
                    <span>Add to Cart</span>
                  )}
                </button>
              </div>
            </div>

            {/* Price breakdown from start */}
            {pricing.totalDays > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">Pricing Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Base Fare ({formatCurrency(pricing.pricePerDay)} × {pricing.totalDays} days × {quantity} unit{quantity > 1 ? 's' : ''})</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(pricing.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Estimated Home Delivery</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(pricing.deliveryCharge)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST Tax (18%)</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(pricing.taxes)}</span>
                  </div>
                  <div className="border-t border-gray-150 pt-2 flex justify-between text-base font-bold">
                    <span className="text-gray-900">Total Price</span>
                    <span className="text-green-600">{formatCurrency(pricing.total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
