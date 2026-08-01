import React from 'react';
import { Link } from 'react-router-dom';

const AuthLayout = ({ children, title, subtitle, linkText, linkTo, linkLabel, showBackToHome = true }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4 py-8 font-sans">
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2.5s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-[10px] font-extrabold tracking-[0.25em] text-slate-400 uppercase">SmartRent Platform</h1>
          <h2 className="text-2xl font-extrabold text-slate-800 mt-1">{title}</h2>
          <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">{subtitle}</p>
        </div>

        {/* Card Body */}
        <div className="bg-white rounded-3xl shadow-xl border border-white p-8 relative overflow-hidden">
          <div className="relative z-10">
            {children}
            
            {/* Nav links */}
            {linkText && (
              <div className="mt-8 text-center text-xs font-semibold">
                <p className="text-slate-400">
                  {linkText}{' '}
                  <Link
                    to={linkTo}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {linkLabel}
                  </Link>
                </p>
              </div>
            )}

            {/* Back Home */}
            {showBackToHome && (
              <div className="mt-5 text-center">
                <Link
                  to="/"
                  className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to home
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
