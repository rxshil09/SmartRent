import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../lib/api';
import { useWishlist } from '../../../contexts/WishlistContext';
import { useCart } from '../../../contexts/CartContext';
import CustomerNav from '../../../components/CustomerNav';

const RentalShopPage = () => {
  const navigate = useNavigate();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { cart } = useCart();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    brand: '',
    condition: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');
        const params = new URLSearchParams({ page: pagination.page, limit: pagination.limit, rentable: 'true' });
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== '') params.append(key, value);
        });
        const response = await api.get(`/products?${params}`);
        const data = response.data;
        setProducts(data.items || []);
        setPagination(prev => ({ ...prev, total: data.total || 0, hasNext: data.hasNext || false, hasPrev: data.hasPrev || false }));
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters, pagination.page, pagination.limit]);

  const fetchInitialData = async () => {
    try {
      const [categoriesRes, brandsRes] = await Promise.all([
        api.get('/products/categories'),
        api.get('/products/brands'),
      ]);
      setCategories(categoriesRes.data.categories || []);
      setBrands(brandsRes.data.brands || []);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ search: '', category: '', brand: '', condition: '', minPrice: '', maxPrice: '', sortBy: 'createdAt', sortOrder: 'desc' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) return product.images[0];
    return `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300" fill="none"><rect width="300" height="300" fill="#E5E7EB"/><text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="#9CA3AF" font-family="Arial, sans-serif" font-size="80" font-weight="bold">${product.name?.charAt(0) || 'P'}</text></svg>`)}`;
  };

  const getAvailabilityBadge = (product) => {
    if (product.availableStock === 0) return { label: 'Out of Stock', classes: 'bg-red-50 text-red-600 border border-red-100' };
    if (product.availableStock <= 2) return { label: `Only ${product.availableStock} left`, classes: 'bg-amber-50 text-amber-700 border border-amber-100' };
    return { label: 'Available', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-100' };
  };

  const isInCart = (productId) => cart.some(item => item.id === productId);

  const conditionOptions = ['New', 'Good', 'Fair', 'Poor'];
  const hasActiveFilters = filters.search || filters.category || filters.brand || filters.condition || filters.minPrice || filters.maxPrice;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <CustomerNav />

      {/* Category Pills */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleFilterChange('category', '')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                !filters.category
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleFilterChange('category', cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  filters.category === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className="w-60 flex-shrink-0 hidden lg:block">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-8">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Filters</h3>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-blue-600 font-semibold hover:underline">
                    Clear All
                  </button>
                )}
              </div>

              {/* Price Range */}
              <div className="mb-5">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Price / Day (₹)</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Brand Filter */}
              <div className="mb-5">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Brand</h4>
                <select
                  value={filters.brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 cursor-pointer text-gray-800"
                >
                  <option value="">All Brands</option>
                  {brands.map((brand) => <option key={brand} value={brand} className="text-gray-800">{brand}</option>)}
                </select>
              </div>

              {/* Condition Filter */}
              <div className="mb-5">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Condition</h4>
                <div className="space-y-2">
                  {conditionOptions.map((c) => (
                    <label key={c} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="condition"
                        value={c}
                        checked={filters.condition === c}
                        onChange={() => handleFilterChange('condition', c)}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{c}</span>
                    </label>
                  ))}
                  {filters.condition && (
                    <button onClick={() => handleFilterChange('condition', '')} className="text-xs text-gray-400 hover:text-red-500 transition-colors mt-1">
                      × Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search & Sort Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search products, brands..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Sort</label>
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    handleFilterChange('sortBy', sortBy);
                    handleFilterChange('sortOrder', sortOrder);
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="createdAt-desc">Latest</option>
                  <option value="name-asc">Name A–Z</option>
                  <option value="name-desc">Name Z–A</option>
                  <option value="pricePerDay-asc">Price ↑</option>
                  <option value="pricePerDay-desc">Price ↓</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            {!loading && pagination.total > 0 && (
              <p className="text-xs text-gray-500 mb-4 font-medium">
                Showing {products.length} of <span className="text-gray-800 font-bold">{pagination.total}</span> products
                {filters.category && <span> in <span className="text-blue-600">{filters.category}</span></span>}
              </p>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700 font-medium">{error}</div>
            )}

            {/* Loading Skeleton */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-9 bg-gray-200 rounded-xl mt-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Products Grid */}
            {!loading && products.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {products.map((product) => {
                  const badge = getAvailabilityBadge(product);
                  const wishlisted = isWishlisted(product.id);
                  const inCart = isInCart(product.id);
                  const isOos = product.availableStock < 1;

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                    >
                      {/* Image */}
                      <div className="relative w-full h-48 bg-gray-50 flex-shrink-0 overflow-hidden">
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300" fill="none"><rect width="300" height="300" fill="#F3F4F6"/><text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="#9CA3AF" font-family="Arial" font-size="80" font-weight="bold">${product.name?.charAt(0) || 'P'}</text></svg>`)}`;
                          }}
                        />
                        {/* Wishlist button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                          className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                        >
                          <svg
                            className={`w-4 h-4 transition-colors ${wishlisted ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                            fill={wishlisted ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                        {/* In-cart badge */}
                        {inCart && (
                          <span className="absolute top-2.5 left-2.5 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">In Cart</span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="p-4 flex flex-col flex-grow">
                        {/* Category + Brand */}
                        <p className="text-xs text-gray-400 font-medium mb-1 truncate">{product.category}{product.brand ? ` • ${product.brand}` : ''}</p>
                        {/* Name */}
                        <h3 className="text-sm font-bold text-gray-900 mb-2 leading-tight line-clamp-2 flex-grow">{product.name}</h3>
                        
                        {/* Price + Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-base font-extrabold text-blue-600">
                            ₹{Number(product.pricePerDay).toLocaleString('en-IN')}
                            <span className="text-xs font-medium text-gray-400">/day</span>
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.classes}`}>
                            {badge.label}
                          </span>
                        </div>

                        {/* CTA Button */}
                        <button
                          onClick={() => navigate(`/products/${product.id}`)}
                          disabled={isOos}
                          className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
                            isOos
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : inCart
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                          }`}
                        >
                          {isOos ? 'Out of Stock' : inCart ? 'View Details' : 'Rent Now'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* No Results */}
            {!loading && products.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-1">No products found</h3>
                <p className="text-sm text-gray-500 mb-5">Try adjusting your search or filters.</p>
                <button
                  onClick={clearFilters}
                  className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {!loading && pagination.total > pagination.limit && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>

                <div className="flex items-center gap-1">
                  {[...Array(Math.ceil(pagination.total / pagination.limit)).keys()].map((num) => {
                    const pageNum = num + 1;
                    const totalPages = Math.ceil(pagination.total / pagination.limit);
                    if (pageNum === pagination.page || Math.abs(pageNum - pagination.page) <= 1 || pageNum === 1 || pageNum === totalPages) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                            pageNum === pagination.page
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (Math.abs(pageNum - pagination.page) === 2) {
                      return <span key={pageNum} className="text-gray-400 px-1">…</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalShopPage;
