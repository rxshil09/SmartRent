import { prisma } from '../db/postgres.js';

export class ReportsService {
  // Get dashboard overview statistics
  static async getDashboardStats() {
    try {
      const [totalProducts, totalRentals, activeRentals, revenueResult] = await Promise.all([
        prisma.product.count().catch(() => 0),
        prisma.rental.count({
          where: {
            status: { in: ['PENDING', 'CONFIRMED', 'PICKED_UP', 'RETURNED', 'OVERDUE'] }
          }
        }).catch(() => 0),
        prisma.rental.count({
          where: { 
            status: { 
              in: ['CONFIRMED', 'PICKED_UP', 'OVERDUE'] 
            } 
          }
        }).catch(() => 0),
        prisma.rental.aggregate({
          where: {
            status: { in: ['PENDING', 'CONFIRMED', 'PICKED_UP', 'RETURNED', 'OVERDUE'] }
          },
          _sum: { totalPrice: true }
        }).catch(() => ({ _sum: { totalPrice: 0 } }))
      ]);

      const totalRevenue = Number(revenueResult._sum.totalPrice || 0);

      return {
        totalProducts,
        totalRentals,
        activeRentals,
        totalRevenue
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalProducts: 0,
        totalRentals: 0,
        activeRentals: 0,
        totalRevenue: 0
      };
    }
  }

  // Get top categories by rental count (Optimized: single groupBy + findMany)
  static async getTopCategories(limit = 10) {
    try {
      const grouped = await prisma.rental.groupBy({
        where: {
          status: { in: ['PENDING', 'CONFIRMED', 'PICKED_UP', 'RETURNED', 'OVERDUE'] }
        },
        by: ['productId'],
        _count: {
          id: true
        }
      });
      
      if (grouped.length === 0) return [];

      const productIds = grouped.map(g => g.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, category: true }
      });
      
      const productMap = new Map(products.map(p => [p.id, p.category || 'Uncategorized']));
      const categoryMap = new Map();
      
      for (const group of grouped) {
        const category = productMap.get(group.productId) || 'Uncategorized';
        const count = group._count.id;
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { name: category, count: 0 });
        }
        categoryMap.get(category).count += count;
      }
      
      return Array.from(categoryMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top categories:', error);
      return [];
    }
  }

  // Get top products by rental count and revenue (Optimized: single groupBy + findMany)
  static async getTopProducts(limit = 10) {
    try {
      const grouped = await prisma.rental.groupBy({
        where: {
          status: { in: ['PENDING', 'CONFIRMED', 'PICKED_UP', 'RETURNED', 'OVERDUE'] }
        },
        by: ['productId'],
        _count: {
          id: true
        },
        _sum: {
          totalPrice: true
        }
      });
      
      if (grouped.length === 0) return [];

      const productIds = grouped.map(g => g.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, category: true }
      });
      
      const productMap = new Map(products.map(p => [p.id, p]));
      
      const productStats = grouped.map(group => {
        const product = productMap.get(group.productId) || {};
        return {
          id: group.productId,
          name: product.name || 'Unknown Product',
          category: product.category || 'Uncategorized',
          rentalCount: group._count.id,
          totalRevenue: Number(group._sum.totalPrice || 0)
        };
      });
      
      return productStats
        .sort((a, b) => b.rentalCount - a.rentalCount)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top products:', error);
      return [];
    }
  }

  // Get top customers by rental count and spending (Optimized: single groupBy)
  static async getTopCustomers(limit = 10) {
    try {
      const grouped = await prisma.rental.groupBy({
        where: {
          status: { in: ['PENDING', 'CONFIRMED', 'PICKED_UP', 'RETURNED', 'OVERDUE'] }
        },
        by: ['userId', 'userEmail', 'userName'],
        _count: {
          id: true
        },
        _sum: {
          totalPrice: true
        }
      });
      
      const customerStats = grouped.map(group => ({
        id: group.userId,
        email: group.userEmail,
        name: group.userName,
        rentalCount: group._count.id,
        totalSpent: Number(group._sum.totalPrice || 0)
      }));
      
      return customerStats
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top customers:', error);
      return [];
    }
  }

  // Get revenue trends over time
  static async getRevenueTrends(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const rentals = await prisma.rental.findMany({
        where: {
          createdAt: {
            gte: startDate
          },
          status: {
            in: ['PENDING', 'CONFIRMED', 'PICKED_UP', 'RETURNED', 'OVERDUE']
          }
        },
        select: {
          createdAt: true,
          totalPrice: true
        }
      }).catch(() => []);

      const revenueByDate = new Map();
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        revenueByDate.set(dateStr, { period: dateStr, revenue: 0 });
      }

      for (const rental of rentals) {
        const dateStr = rental.createdAt.toISOString().split('T')[0];
        if (revenueByDate.has(dateStr)) {
          revenueByDate.get(dateStr).revenue += Number(rental.totalPrice || 0);
        }
      }

      return Array.from(revenueByDate.values())
        .sort((a, b) => new Date(a.period) - new Date(b.period));
    } catch (error) {
      console.error('Error getting revenue trends:', error);
      return [];
    }
  }

  // Get complete analytics report
  static async getAnalyticsReport() {
    try {
      const [dashboardStats, topCategories, topProducts, topCustomers, revenueTrends] = await Promise.all([
        this.getDashboardStats(),
        this.getTopCategories(5),
        this.getTopProducts(5),
        this.getTopCustomers(5),
        this.getRevenueTrends(30)
      ]);

      return {
        dashboardStats,
        topCategories,
        topProducts,
        topCustomers,
        revenueTrends
      };
    } catch (error) {
      console.error('Error getting analytics report:', error);
      return {
        dashboardStats: {
          totalProducts: 0,
          totalRentals: 0,
          activeRentals: 0,
          totalRevenue: 0
        },
        topCategories: [],
        topProducts: [],
        topCustomers: [],
        revenueTrends: []
      };
    }
  }
}
