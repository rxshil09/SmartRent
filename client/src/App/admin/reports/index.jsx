import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import api from '../../../lib/api';

const Reports = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [topCategories, setTopCategories] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, categoriesRes, productsRes, customersRes, revenueRes] = await Promise.all([
        api.get('/reports/dashboard-stats'),
        api.get('/reports/top-categories'),
        api.get('/reports/top-products'),
        api.get('/reports/top-customers'),
        api.get('/reports/revenue-trends')
      ]);

      setDashboardStats(statsRes.data);
      setTopCategories(categoriesRes.data || []);
      setTopProducts(productsRes.data || []);
      setTopCustomers(customersRes.data || []);
      setRevenueData(revenueRes.data || []);
    } catch (err) {
      setError('Failed to fetch reports data');
      console.error('Reports fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  };

  const handleExportCSV = () => {
    if (revenueData.length === 0) return alert('No data to export.');
    
    const headers = ['Date', 'Revenue'];
    const rows = revenueData.map(d => [d.period, d.revenue]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `revenue_trends_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="h-10 bg-gray-200 rounded-lg w-80 mb-2 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded-lg w-96 animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 animate-pulse border border-gray-200">
                <div className="h-4 bg-gray-200 rounded-lg mb-4 w-24"></div>
                <div className="h-8 bg-gray-200 rounded-lg mb-2 w-20"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-8 animate-pulse border border-gray-200 h-80"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md border border-red-100 p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Reports</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button 
            onClick={fetchReportsData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Comprehensive overview of rental operations and financials</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            Export Revenue Data (CSV)
          </button>
          <button 
            onClick={fetchReportsData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {dashboardStats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white shadow rounded-lg p-5 border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Products</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{dashboardStats.totalProducts}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-5 border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Rentals</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{dashboardStats.totalRentals}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-5 border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Rentals</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{dashboardStats.activeRentals}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-5 border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600 mt-1">₹{dashboardStats.totalRevenue?.toLocaleString('en-IN')}</p>
          </div>
        </div>
      )}

      {/* Revenue Trend - Full Width Row */}
      <div className="bg-white shadow rounded-lg p-6 mb-8 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Trend (Last 30 Days)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ left: -10, right: 10, bottom: 0, top: 10 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 10, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={{ stroke: '#E5E7EB' }}
                tickFormatter={(value) => {
                  const parts = value.split('-');
                  return parts.length >= 3 ? `${parts[2]}/${parts[1]}` : value;
                }}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={{ stroke: '#E5E7EB' }}
                tickFormatter={(val) => `₹${val}`}
              />
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <Tooltip 
                formatter={(value) => [`₹${value?.toLocaleString('en-IN')}`, 'Revenue']} 
                contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E5E7EB' }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3B82F6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Categories - Pie Chart */}
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Rentals by Category</h3>
          <div className="h-72">
            {topCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topCategories}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    labelLine={true}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    dataKey="count"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {topCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Orders']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">No category data available</div>
            )}
          </div>
        </div>

        {/* Top Products - Horizontal Bar Chart to fit long names */}
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top 5 Rented Products</h3>
          <div className="h-72">
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={topProducts.slice(0, 5)} 
                  layout="vertical"
                  margin={{ left: 20, right: 10, top: 10, bottom: 5 }}
                >
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 10, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100}
                    tick={{ fontSize: 9, fill: '#374151' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={{ stroke: '#E5E7EB' }}
                  />
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <Tooltip formatter={(value) => [value, 'Orders']} />
                  <Bar 
                    dataKey="rentalCount" 
                    fill="#4F46E5" 
                    radius={[0, 4, 4, 0]}
                    barSize={15}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">No product data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Products Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-bold text-gray-900">Products Catalog Performance</h3>
            <p className="text-xs text-gray-500 mt-0.5">Ranked by revenue contribution</p>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Rentals</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              {topProducts.slice(0, 5).map((product, idx) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 whitespace-nowrap">
                    <span className="font-semibold text-gray-700 mr-2">#{idx + 1}</span>
                    <span className="text-gray-900 font-medium">{product.name}</span>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-center text-gray-900">
                    {product.rentalCount}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-right font-bold text-gray-900">
                    {formatCurrency(product.totalRevenue)}
                  </td>
                </tr>
              ))}
              {topProducts.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">No products data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Top Customers Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-bold text-gray-900">Top Performing Customers</h3>
            <p className="text-xs text-gray-500 mt-0.5">Ranked by total expenditure</p>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Rentals</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Spent</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              {topCustomers.slice(0, 5).map((customer, idx) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 whitespace-nowrap">
                    <span className="font-semibold text-gray-700 mr-2">#{idx + 1}</span>
                    <span className="text-gray-900 font-medium">{customer.name || customer.email}</span>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-center text-gray-900 font-medium">
                    {customer.rentalCount}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-right font-bold text-green-600">
                    {formatCurrency(customer.totalSpent)}
                  </td>
                </tr>
              ))}
              {topCustomers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">No customer data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
