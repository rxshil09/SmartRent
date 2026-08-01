import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import { useCart } from '../../../../contexts/CartContext';
import CustomerNav from '../../../../components/CustomerNav';

const stateCities = {
  "Madhya Pradesh": ["Indore", "Bhopal", "Gwalior", "Jabalpur", "Ujjain"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik"],
  "Delhi": ["New Delhi", "Dwarka", "Rohini", "Vasant Kunj"],
  "Karnataka": ["Bengaluru", "Mysore", "Hubli", "Mangalore"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem"],
  "Uttar Pradesh": ["Noida", "Lucknow", "Kanpur", "Ghaziabad", "Agra"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri"]
};

const SearchableSelect = ({ value, onChange, options, placeholder, disabled, label, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = React.useRef(null);

  useEffect(() => {
    setSearch(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch(value || '');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const filtered = options.filter(opt => {
    if (search === value) return true;
    return opt.toLowerCase().includes(search.toLowerCase());
  });

  const handleSelect = (val) => {
    onChange({ target: { name: label, value: val } });
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={search}
          disabled={disabled}
          placeholder={placeholder}
          onClick={(e) => {
            if (!disabled) {
              setIsOpen(true);
              e.target.select();
            }
          }}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          className={`w-full px-3 pr-10 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-gray-800 bg-white placeholder-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 transition-transform duration-200">
          <svg className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && !disabled && (
        <ul className="absolute z-50 left-0 right-0 mt-2 max-h-[170px] overflow-y-auto bg-white border border-gray-100 rounded-md shadow-lg py-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200/80 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {filtered.length > 0 ? (
            filtered.map((opt) => (
              <li
                key={opt}
                onClick={() => handleSelect(opt)}
                className={`px-4 py-2 text-sm font-bold cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center justify-between ${
                  opt === value ? 'bg-blue-50/70 text-blue-600' : 'text-gray-700'
                }`}
              >
                <span>{opt}</span>
                {opt === value && (
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </li>
            ))
          ) : (
            <li className="px-4 py-3 text-xs font-bold text-gray-400 italic text-center">
              No options found
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

const DeliveryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    cart,
    fulfillmentMethod,
    setFulfillmentMethod,
    subtotal,
    gstAmount,
    deliveryFee,
    totalAmount,
    couponDiscount
  } = useCart();
  
  const [loading, setLoading] = useState(false);
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [errors, setErrors] = useState({});

  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: user?.name || '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });
  
  const [invoiceAddress, setInvoiceAddress] = useState({
    fullName: user?.name || '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/products');
    }
  }, [cart, navigate]);

  useEffect(() => {
    if (user) {
      setDeliveryAddress(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        addressLine1: prev.addressLine1 || user.addressLine1 || '',
        addressLine2: prev.addressLine2 || user.addressLine2 || '',
        city: prev.city || user.city || '',
        state: prev.state || user.state || '',
        pincode: prev.pincode || user.pincode || ''
      }));
      setInvoiceAddress(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        addressLine1: prev.addressLine1 || user.addressLine1 || '',
        addressLine2: prev.addressLine2 || user.addressLine2 || '',
        city: prev.city || user.city || '',
        state: prev.state || user.state || '',
        pincode: prev.pincode || user.pincode || ''
      }));
    }
  }, [user]);

  const handleDeliveryAddressChange = (field, value) => {
    setDeliveryAddress(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'state') {
        const cities = stateCities[value] || [];
        updated.city = cities[0] || '';
      }
      if (useSameAddress) {
        setInvoiceAddress(updated);
      }
      return updated;
    });

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleInvoiceAddressChange = (field, value) => {
    setInvoiceAddress(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'state') {
        const cities = stateCities[value] || [];
        updated.city = cities[0] || '';
      }
      return updated;
    });

    if (errors[`invoice_${field}`]) {
      setErrors(prev => ({ ...prev, [`invoice_${field}`]: '' }));
    }
  };

  const handleSameAddressToggle = () => {
    const newValue = !useSameAddress;
    setUseSameAddress(newValue);
    if (newValue) {
      setInvoiceAddress({ ...deliveryAddress });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (fulfillmentMethod === 'DELIVERY') {
      const requiredDeliveryFields = ['fullName', 'phoneNumber', 'addressLine1', 'city', 'state', 'pincode'];
      requiredDeliveryFields.forEach(field => {
        if (!deliveryAddress[field].trim()) {
          newErrors[field] = 'Required';
        }
      });
      if (deliveryAddress.pincode && !/^\d{6}$/.test(deliveryAddress.pincode)) {
        newErrors.pincode = 'Must be 6 digits';
      }
      if (deliveryAddress.phoneNumber && !/^\d{10}$/.test(deliveryAddress.phoneNumber)) {
        newErrors.phoneNumber = 'Must be 10 digits';
      }
    }

    // Invoice validation
    const checkInvoice = fulfillmentMethod === 'PICKUP' || !useSameAddress;
    if (checkInvoice) {
      const requiredInvoiceFields = ['fullName', 'phoneNumber', 'addressLine1', 'city', 'state', 'pincode'];
      requiredInvoiceFields.forEach(field => {
        if (!invoiceAddress[field].trim()) {
          newErrors[`invoice_${field}`] = 'Required';
        }
      });
      if (invoiceAddress.pincode && !/^\d{6}$/.test(invoiceAddress.pincode)) {
        newErrors.invoice_pincode = 'Must be 6 digits';
      }
      if (invoiceAddress.phoneNumber && !/^\d{10}$/.test(invoiceAddress.phoneNumber)) {
        newErrors.invoice_phoneNumber = 'Must be 10 digits';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validateForm()) {
      const firstErrorField = document.querySelector('.border-red-300');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setLoading(true);

    const finalDeliveryAddress = fulfillmentMethod === 'PICKUP' ? invoiceAddress : deliveryAddress;
    const finalInvoiceAddress = invoiceAddress;
    
    const addressData = {
      deliveryAddress: finalDeliveryAddress,
      invoiceAddress: finalInvoiceAddress,
      useSameAddress
    };
    
    localStorage.setItem('sr_address', JSON.stringify(addressData));
    
    setTimeout(() => {
      setLoading(false);
      navigate('/checkout/review');
    }, 500);
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const deliveryMethods = [
    { id: 'pickup', name: 'Pickup from Store', price: 0, description: 'Free pickup from our store location' },
    { id: 'delivery', name: 'Home Delivery', price: 99, description: 'Delivered to your doorstep (₹99)' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <CustomerNav />

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4 text-xs font-semibold">
            <span className="text-gray-400">Review Order</span>
            <span className="text-gray-300">›</span>
            <span className="text-blue-600">Delivery Method & Address</span>
            <span className="text-gray-300">›</span>
            <span className="text-gray-400">Payment</span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          
          {/* Form Side */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Delivery Method Selector (Moved ABOVE address forms) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Choose Fulfillment Method</h2>
              <div className="space-y-3">
                {deliveryMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      fulfillmentMethod.toLowerCase() === method.id
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={method.id}
                      checked={fulfillmentMethod.toLowerCase() === method.id}
                      onChange={(e) => setFulfillmentMethod(e.target.value.toUpperCase())}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-900">{method.name}</span>
                        <span className="text-sm font-bold text-gray-900">
                          {method.price === 0 ? 'Free' : formatCurrency(method.price)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{method.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Delivery Address Form - ONLY render if Home Delivery is selected */}
            {fulfillmentMethod === 'DELIVERY' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-base font-bold text-gray-900 mb-4">Delivery Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={deliveryAddress.fullName}
                      onChange={(e) => handleDeliveryAddressChange('fullName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.fullName ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      value={deliveryAddress.phoneNumber}
                      onChange={(e) => handleDeliveryAddressChange('phoneNumber', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Address *</label>
                    <input
                      type="text"
                      value={deliveryAddress.addressLine1}
                      placeholder="Flat, House no., Building, Company, Apartment"
                      onChange={(e) => handleDeliveryAddressChange('addressLine1', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.addressLine1 ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Area, Colony, Street, Sector</label>
                    <input
                      type="text"
                      value={deliveryAddress.addressLine2}
                      onChange={(e) => handleDeliveryAddressChange('addressLine2', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">State *</label>
                    <SearchableSelect
                      value={deliveryAddress.state}
                      onChange={(e) => handleDeliveryAddressChange('state', e.target.value)}
                      options={Object.keys(stateCities)}
                      placeholder="Search/Select State"
                      label="state"
                      error={errors.state}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">City *</label>
                    <SearchableSelect
                      value={deliveryAddress.city}
                      onChange={(e) => handleDeliveryAddressChange('city', e.target.value)}
                      options={stateCities[deliveryAddress.state] || []}
                      placeholder="Search/Select City"
                      disabled={!deliveryAddress.state}
                      label="city"
                      error={errors.city}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Pincode *</label>
                    <input
                      type="text"
                      value={deliveryAddress.pincode}
                      onChange={(e) => handleDeliveryAddressChange('pincode', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.pincode ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Landmark</label>
                    <input
                      type="text"
                      value={deliveryAddress.landmark}
                      onChange={(e) => handleDeliveryAddressChange('landmark', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Billing Address (Always visible or toggleable) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-base font-bold text-gray-900">Billing Address</h2>
                {fulfillmentMethod === 'DELIVERY' && (
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useSameAddress}
                      onChange={handleSameAddressToggle}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-xs text-gray-600 font-semibold">Same as delivery address</span>
                  </label>
                )}
              </div>

              {(fulfillmentMethod === 'PICKUP' || !useSameAddress) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={invoiceAddress.fullName}
                      onChange={(e) => handleInvoiceAddressChange('fullName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.invoice_fullName ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      value={invoiceAddress.phoneNumber}
                      onChange={(e) => handleInvoiceAddressChange('phoneNumber', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.invoice_phoneNumber ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Address *</label>
                    <input
                      type="text"
                      value={invoiceAddress.addressLine1}
                      placeholder="Flat, House no., Building, Company, Apartment"
                      onChange={(e) => handleInvoiceAddressChange('addressLine1', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.invoice_addressLine1 ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Area, Colony, Street, Sector</label>
                    <input
                      type="text"
                      value={invoiceAddress.addressLine2}
                      onChange={(e) => handleInvoiceAddressChange('addressLine2', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">State *</label>
                    <SearchableSelect
                      value={invoiceAddress.state}
                      onChange={(e) => handleInvoiceAddressChange('state', e.target.value)}
                      options={Object.keys(stateCities)}
                      placeholder="Search/Select State"
                      label="state"
                      error={errors.invoice_state}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">City *</label>
                    <SearchableSelect
                      value={invoiceAddress.city}
                      onChange={(e) => handleInvoiceAddressChange('city', e.target.value)}
                      options={stateCities[invoiceAddress.state] || []}
                      placeholder="Search/Select City"
                      disabled={!invoiceAddress.state}
                      label="city"
                      error={errors.invoice_city}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Pincode *</label>
                    <input
                      type="text"
                      value={invoiceAddress.pincode}
                      onChange={(e) => handleInvoiceAddressChange('pincode', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.invoice_pincode ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Landmark</label>
                    <input
                      type="text"
                      value={invoiceAddress.landmark}
                      onChange={(e) => handleInvoiceAddressChange('landmark', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
              {fulfillmentMethod === 'DELIVERY' && useSameAddress && (
                <p className="text-xs text-gray-500 italic">Using delivery address for billing/invoicing.</p>
              )}
            </div>
          </div>

          {/* Right Side: Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h3 className="text-base font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Checkout Details</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Items Count</span>
                  <span className="font-semibold text-gray-900">{cart.length} item(s)</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Fulfillment Fee</span>
                  <span className="font-semibold text-gray-900">
                    {deliveryFee === 0 ? 'Free' : formatCurrency(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST Tax (18%)</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(gstAmount)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount</span>
                    <span>-{formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-150 pt-3 flex justify-between text-base font-extrabold text-gray-900">
                  <span>Total Amount</span>
                  <span className="text-green-600">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-bold transition-colors text-sm flex justify-center items-center"
                >
                  {loading ? 'Processing...' : 'Continue to Review'}
                </button>
                <button
                  onClick={() => navigate('/cart')}
                  className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-bold transition-colors text-xs"
                >
                  Back to Cart
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DeliveryPage;
