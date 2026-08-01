import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ParticleBackground from '../components/ParticleBackground';

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Instant Booking',
      description: 'Book any product instantly with real-time availability checking and immediate confirmation.'
    },
    {
      icon: (
        <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Secure Payments',
      description: 'Safe and secure payment processing with multiple payment options including UPI, cards, and wallets.'
    },
    {
      icon: (
        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Flexible Duration',
      description: 'Rent for hours, days, weeks, or months. Flexible rental periods to suit your needs.'
    },
    {
      icon: (
        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        </svg>
      ),
      title: 'Doorstep Delivery',
      description: 'Get your rented items delivered to your doorstep and picked up when done.'
    },
    {
      icon: (
        <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
        </svg>
      ),
      title: '24/7 Support',
      description: 'Round-the-clock customer support to help you with any questions or issues.'
    },
    {
      icon: (
        <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Smart Analytics',
      description: 'Track your rental history, expenses, and get insights to make better decisions.'
    }
  ];

  const categories = [
    { name: 'Tools & Equipment', count: '50+', image: '🔧' },
    { name: 'Electronics', count: '30+', image: '📱' },
    { name: 'Furniture', count: '40+', image: '🪑' },
    { name: 'Vehicles', count: '25+', image: '🚗' },
    { name: 'Events & Party', count: '35+', image: '🎉' },
    { name: 'Sports & Fitness', count: '20+', image: '⚽' }
  ];

  const testimonials = [
    {
      name: 'Vikash Rao',
      role: 'Event Organizer',
      content: 'SmartRent made organizing my wedding so much easier. I could rent everything from tents to sound systems in one place!',
      rating: 5
    },
    {
      name: 'Teijas Saini',
      role: 'Contractor',
      content: 'As a contractor, I need different tools for different projects. SmartRent saves me thousands in equipment costs.',
      rating: 5
    },
    {
      name: 'Nitish Choubey',
      role: 'Homeowner',
      content: 'Perfect for occasional needs. Why buy expensive tools when you can rent them for a fraction of the cost?',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden font-sans">
      {/* Particle Background */}
      <ParticleBackground />

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-xl shadow-lg border-b border-gray-100/50' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                SmartRent
              </span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 font-semibold transition-colors">
                Features
              </a>
              <a href="#categories" className="text-gray-700 hover:text-blue-600 font-semibold transition-colors">
                Categories
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 font-semibold transition-colors">
                Reviews
              </a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 font-semibold transition-colors">
                Contact
              </a>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <Link
                to="/auth/login"
                className="text-gray-700 hover:text-blue-600 font-semibold transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/auth/signup"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-36 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
              Rent Anything,
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block mt-1">
                Anytime
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed font-medium">
              From tools to electronics, furniture to vehicles - rent what you need, when you need it. 
              Smart, affordable, and sustainable.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                to="/auth/signup"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center space-x-2"
              >
                <span>Start Renting Today</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <button className="border-2 border-gray-300 bg-white hover:border-blue-600 text-gray-700 hover:text-blue-600 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center space-x-2 shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-white/50 shadow-sm">
                <div className="text-3xl md:text-4xl font-extrabold text-blue-600 mb-1">50+</div>
                <div className="text-gray-500 font-bold text-xs uppercase tracking-wider">Products Available</div>
              </div>
              <div className="text-center bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-white/50 shadow-sm">
                <div className="text-3xl md:text-4xl font-extrabold text-indigo-600 mb-1">20+</div>
                <div className="text-gray-500 font-bold text-xs uppercase tracking-wider">Happy Customers</div>
              </div>
              <div className="text-center bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-white/50 shadow-sm">
                <div className="text-3xl md:text-4xl font-extrabold text-purple-600 mb-1">3+</div>
                <div className="text-gray-500 font-bold text-xs uppercase tracking-wider">Cities Covered</div>
              </div>
              <div className="text-center bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-white/50 shadow-sm">
                <div className="text-3xl md:text-4xl font-extrabold text-green-600 mb-1">24/7</div>
                <div className="text-gray-500 font-bold text-xs uppercase tracking-wider">Customer Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 bg-white/80 backdrop-blur-sm border-t border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Why Choose SmartRent?
            </h2>
            <p className="text-lg text-gray-500 max-w-3xl mx-auto font-semibold">
              Experience the future of rental services with our cutting-edge platform designed for convenience and reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
              >
                <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Explore Categories
            </h2>
            <p className="text-lg text-gray-500 max-w-3xl mx-auto font-semibold">
              Discover thousands of products across multiple categories, all available for rent at competitive prices.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 cursor-pointer group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">
                  {category.image}
                </div>
                <h3 className="font-bold text-gray-800 text-sm mb-1">{category.name}</h3>
                <p className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wide">{category.count} items</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-20 bg-white/80 backdrop-blur-sm border-t border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              How It Works
            </h2>
            <p className="text-lg text-gray-500 max-w-3xl mx-auto font-semibold">
              Renting has never been this simple. Get what you need in just a few clicks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Browse & Select', description: 'Find the perfect product from our extensive catalog' },
              { step: '02', title: 'Choose Duration', description: 'Select your rental period - from hours to months' },
              { step: '03', title: 'Secure Payment', description: 'Pay safely with multiple payment options' },
              { step: '04', title: 'Enjoy & Return', description: 'Use your rented item and return when done' }
            ].map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-extrabold text-lg mx-auto mb-5 shadow-md">
                  {step.step}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-xs text-gray-500 font-medium px-4">{step.description}</p>
                
                {/* Connecting Line */}
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-300 to-indigo-300 transform -translate-x-1/2"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              What Our Customers Say
            </h2>
            <p className="text-lg text-gray-500 max-w-3xl mx-auto font-semibold">
              Join thousands of satisfied customers who trust SmartRent for their rental needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
              >
                <div className="flex items-center mb-4 text-yellow-400">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mb-6 italic leading-relaxed font-semibold">"{testimonial.content}"</p>
                <div>
                  <div className="font-bold text-gray-800 text-sm">{testimonial.name}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.06),transparent)] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Ready to Start Renting?
          </h2>
          <p className="text-base text-blue-100 mb-8 max-w-2xl mx-auto font-medium">
            Join thousands of smart renters who save money and reduce waste by renting instead of buying.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth/signup"
              className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-3.5 rounded-xl font-bold text-xs shadow-md transition-all uppercase tracking-wider"
            >
              Create Free Account
            </Link>
            <Link
              to="/auth/login"
              className="border border-white/40 text-white hover:bg-white/10 px-8 py-3.5 rounded-xl font-bold text-xs transition-all uppercase tracking-wider"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="relative z-10 bg-slate-900 text-gray-400 text-xs py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center space-x-2">
                <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="text-xl font-extrabold text-white">SmartRent</span>
              </div>
              <p className="text-gray-400 font-medium max-w-sm leading-relaxed">
                Revolutionizing the rental industry with smart technology, sustainable practices, and exceptional customer service.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Quick Links</h3>
              <ul className="space-y-2.5 font-semibold">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#categories" className="hover:text-white transition-colors">Categories</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Reviews</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Contact Us</h3>
              <ul className="space-y-2.5 font-semibold">
                <li>Email: hello@smartrent.com</li>
                <li>Phone: +91 98765 43210</li>
                <li>Mumbai, India</li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center font-medium">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} SmartRent. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0 text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;