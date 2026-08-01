import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWishlist } from '../../../contexts/WishlistContext';
import CustomerNav from '../../../components/CustomerNav';

const WishlistPage = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const navigate = useNavigate();

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) return product.images[0];
    return `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300" fill="none"><rect width="300" height="300" fill="#E5E7EB"/><text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="#9CA3AF" font-family="Arial" font-size="80" font-weight="bold">${product.name?.charAt(0) || 'P'}</text></svg>`)}`;
  };

  const formatCurrency = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <CustomerNav />
        <div className="flex-grow flex items-center justify-center py-16 px-4">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center max-w-md w-full">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 text-sm mb-8">Save items you love here to easily rent them later.</p>
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md hover:shadow-lg"
            >
              Start Exploring
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <CustomerNav />
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Wishlist</h1>
          <p className="text-sm text-gray-500 mt-0.5">{wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved</p>
        </div>

        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlist.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Image & Overlay */}
              <div className="relative w-full h-48 bg-gray-50 flex-shrink-0 overflow-hidden">
                <img
                  src={getProductImage(product)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeFromWishlist(product.id)}
                  className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm text-red-500 hover:scale-110 transition-transform"
                  title="Remove from wishlist"
                >
                  <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Card Body */}
              <div className="p-4 flex flex-col flex-grow justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{product.category}</span>
                  <h3
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="font-bold text-gray-900 text-sm mt-1 mb-2 hover:text-blue-600 transition-colors line-clamp-2 cursor-pointer"
                  >
                    {product.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-extrabold text-blue-600">{formatCurrency(product.pricePerDay)}</span>
                    <span className="text-xs font-semibold text-gray-400">/day</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    Rent Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
