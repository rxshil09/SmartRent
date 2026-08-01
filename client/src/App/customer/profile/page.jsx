import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../lib/api';
import CustomerNav from '../../../components/CustomerNav';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profileName, setProfileName] = useState(user?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    totalRentals: 0,
    activeRentals: 0,
    completedRentals: 0
  });

  useEffect(() => {
    fetchProfileStats();
  }, []);

  useEffect(() => {
    if (user?.name) {
      setProfileName(user.name);
    }
  }, [user]);

  const fetchProfileStats = async () => {
    try {
      const response = await api.get('/rentals/my-rentals');
      const rentals = response.data.items || [];
      const active = rentals.filter(r => ['PENDING', 'CONFIRMED', 'PICKED_UP', 'OVERDUE'].includes(r.status)).length;
      const completed = rentals.filter(r => r.status === 'RETURNED').length;
      
      setStats({
        totalRentals: rentals.length,
        activeRentals: active,
        completedRentals: completed
      });
    } catch (err) {
      console.error('Failed to fetch profile stats:', err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    const userId = user?.id || user?._id;
    if (!userId) {
      setError('User session not found. Please log in again.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const response = await api.patch(`/users/${userId}/profile`, { name: profileName });
      
      if (updateUser && response.data.user) {
        updateUser(response.data.user);
      }
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile name:', err);
      setError(err.response?.data?.message || 'Failed to update profile name');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <CustomerNav />

      <main className="flex-grow max-w-3xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Account Settings</h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">Manage your personal profile details and check summary statistics.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-semibold">{error}</div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-sm font-semibold">{success}</div>
        )}

        {/* Stats Grid Widget */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Active Rentals', val: stats.activeRentals, color: 'text-blue-600 bg-blue-50/50 border border-blue-100' },
            { label: 'Completed', val: stats.completedRentals, color: 'text-emerald-600 bg-emerald-50/50 border border-emerald-100' },
            { label: 'Total Placed', val: stats.totalRentals, color: 'text-indigo-600 bg-indigo-50/50 border border-indigo-100' }
          ].map((s, idx) => (
            <div key={idx} className={`p-4 rounded-2xl text-center ${s.color}`}>
              <p className="text-2xl font-extrabold">{s.val}</p>
              <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Account Details Box */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
            <h2 className="text-base font-bold text-gray-800">Personal Information</h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
              <p className="text-sm font-bold text-gray-800 bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-xl inline-block">{user?.email}</p>
              <p className="text-[10px] text-gray-400 mt-1">Your registered email address is fixed and cannot be changed.</p>
            </div>

            {/* Name Form */}
            <div className="border-t border-gray-50 pt-5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="flex-grow max-w-sm px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 font-bold text-gray-800"
                    required
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileName(user?.name || '');
                        setIsEditing(false);
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between max-w-sm gap-4 bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-xl">
                  <span className="text-sm font-bold text-gray-800">{profileName || user?.name}</span>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold"
                  >
                    Edit Name
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Address Book Card */}
        <AddressBookCard />

        {/* Member since metadata */}
        <div className="text-center">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
            SmartRent customer since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : 'August 2026'}
          </p>
        </div>
      </main>
    </div>
  );
};

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

const SearchableSelect = ({ value, onChange, options, placeholder, disabled, label }) => {
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
          className="w-full px-4 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-gray-800 bg-white placeholder-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 transition-transform duration-200">
          <svg className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && !disabled && (
        <ul className="absolute z-50 left-0 right-0 mt-2 max-h-[130px] overflow-y-auto bg-white border border-gray-100 rounded-2xl shadow-xl py-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200/80 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {filtered.length > 0 ? (
            filtered.map((opt) => (
              <li
                key={opt}
                onClick={() => handleSelect(opt)}
                className={`px-4 py-2.5 text-sm font-bold cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center justify-between ${
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

const AddressBookCard = () => {
  const { user, updateUser } = useAuth();
  const [address, setAddress] = useState({
    addressLine1: user?.addressLine1 || '',
    addressLine2: user?.addressLine2 || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || ''
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setAddress({
        addressLine1: user.addressLine1 || '',
        addressLine2: user.addressLine2 || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'state') {
      const cities = stateCities[value] || [];
      setAddress(prev => ({
        ...prev,
        state: value,
        city: cities[0] || ''
      }));
    } else {
      setAddress(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    const userId = user?.id || user?._id;
    if (!userId) return;

    try {
      setSaving(true);
      setMsg({ type: '', text: '' });
      const response = await api.patch(`/users/${userId}/address`, address);
      if (updateUser && response.data.user) {
        updateUser(response.data.user);
      }
      setMsg({ type: 'success', text: 'Address updated successfully!' });
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update address' });
    } finally {
      setSaving(false);
    }
  };

  const citiesForSelectedState = stateCities[address.state] || [];

  return (
    <div className="bg-white rounded-2xl border border-gray-150 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-150 bg-gray-50/50 flex justify-between items-center rounded-t-2xl">
        <h2 className="text-base font-bold text-gray-800">Saved Address Book</h2>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
          Default Delivery
        </span>
      </div>
      <form onSubmit={handleSaveAddress} className="p-6 space-y-4 text-xs font-semibold text-gray-400">
        {msg.text && (
          <div className={`p-4 rounded-xl text-xs font-semibold ${msg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {msg.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block uppercase tracking-wider mb-2">Address Line 1</label>
            <input
              type="text"
              name="addressLine1"
              value={address.addressLine1}
              onChange={handleChange}
              placeholder="Flat, House no., Building, Company, Apartment"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-gray-800 placeholder-gray-300"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block uppercase tracking-wider mb-2">Address Line 2 (Optional)</label>
            <input
              type="text"
              name="addressLine2"
              value={address.addressLine2}
              onChange={handleChange}
              placeholder="Area, Street, Sector, Village"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-gray-800 placeholder-gray-300"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 md:col-span-2 gap-4">
            <div>
              <label className="block uppercase tracking-wider mb-2">State</label>
              <SearchableSelect
                value={address.state}
                onChange={handleChange}
                options={Object.keys(stateCities)}
                placeholder="Search/Select State"
                label="state"
              />
            </div>
            
            <div>
              <label className="block uppercase tracking-wider mb-2">City</label>
              <SearchableSelect
                value={address.city}
                onChange={handleChange}
                options={citiesForSelectedState}
                placeholder="Search/Select City"
                disabled={!address.state}
                label="city"
              />
            </div>

            <div>
              <label className="block uppercase tracking-wider mb-2">Pincode</label>
              <input
                type="text"
                name="pincode"
                value={address.pincode}
                onChange={handleChange}
                placeholder="6 digits"
                maxLength="6"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-gray-800 placeholder-gray-300"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Default Address'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
