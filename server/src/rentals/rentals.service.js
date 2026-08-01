import { prisma } from '../db/postgres.js';
import { Prisma } from '@prisma/client';
import { PDFService } from './pdf.service.js';
import  NotificationsService  from '../notifications/notifications.service.js';

// Helper to serialize decimal fields
const serialize = (rental) => rental && ({
  ...rental,
  pricePerDay: rental.pricePerDay ? Number(rental.pricePerDay) : 0,
  totalPrice: rental.totalPrice ? Number(rental.totalPrice) : 0
});

// Helper to serialize Order fields
const serializeOrder = (order) => order && ({
  ...order,
  subtotal: order.subtotal ? Number(order.subtotal) : 0,
  gstAmount: order.gstAmount ? Number(order.gstAmount) : 0,
  deliveryFee: order.deliveryFee ? Number(order.deliveryFee) : 0,
  totalAmount: order.totalAmount ? Number(order.totalAmount) : 0,
  couponDiscount: order.couponDiscount ? Number(order.couponDiscount) : 0,
  rentals: order.rentals ? order.rentals.map(serialize) : []
});

export const RentalsService = {
  // Create a new reservation (multi-item cart)
  async createReservation(data) {
    const { userId, userEmail, userName, items, fulfillmentMethod, addressLine1, addressLine2, city, state, pincode, couponCode } = data;
    
    if (!items || items.length === 0) {
      throw new Error('Cart is empty.');
    }

    // Sort items lexicographically by productId to prevent deadlocks
    const sortedItems = [...items].sort((a, b) => a.productId.localeCompare(b.productId));
    const sortedIds = sortedItems.map(i => i.productId);

    return await prisma.$transaction(async (tx) => {
      // 1. Lock Product rows in strictly sorted order
      const products = await tx.$queryRaw`
        SELECT * FROM "products" 
        WHERE id IN (${Prisma.join(sortedIds)}) 
        ORDER BY id 
        FOR UPDATE
      `;

      let subtotal = 0;
      const lineItemsData = [];

      // 2. Evaluate availability per item
      for (const item of sortedItems) {
        const dbProduct = products.find(p => p.id === item.productId);
        if (!dbProduct) {
          throw new Error(`Product with ID ${item.productId} not found.`);
        }
        if (!dbProduct.isRentable) {
          throw new Error(`Product ${dbProduct.name} is not rentable.`);
        }
        
        const requestedQty = Math.max(1, parseInt(item.quantity) || 1);
        if (dbProduct.availableStock < requestedQty) {
          throw new Error(`Product ${dbProduct.name} does not have enough stock available (Requested: ${requestedQty}, Available: ${dbProduct.availableStock}).`);
        }

        // Calculate rental days
        const start = new Date(item.startDate);
        const end = new Date(item.endDate);
        const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);

        const pricePerDay = Number(dbProduct.pricePerDay);
        const lineTotal = pricePerDay * totalDays * requestedQty;
        subtotal += lineTotal;

        // Move quantity units: availableStock -> reservedStock
        await tx.$executeRaw`
          UPDATE "products" 
          SET "availableStock" = "availableStock" - ${requestedQty},
              "reservedStock" = "reservedStock" + ${requestedQty}
          WHERE id = ${item.productId}
        `;

        // Update in-memory stock for subsequent items of the same product
        dbProduct.availableStock -= requestedQty;

        lineItemsData.push({
          productId: item.productId,
          startDate: start,
          endDate: end,
          totalDays,
          quantity: requestedQty,
          pricePerDay,
          totalPrice: lineTotal,
          status: 'RESERVED',
          notes: item.notes || '',
          userId,
          userEmail,
          userName
        });
      }

      // Calculate coupon discount
      let couponDiscount = 0;
      if (couponCode) {
        const validCoupons = {
          'SAVE10': { discount: 10, type: 'percentage' },
          'FIRST50': { discount: 50, type: 'fixed' },
          'WELCOME': { discount: 5, type: 'percentage' },
          'FESTIVE20': { discount: 20, type: 'percentage' }
        };
        const coupon = validCoupons[couponCode.toUpperCase()];
        if (coupon) {
          if (coupon.type === 'percentage') {
            couponDiscount = Math.round(subtotal * (coupon.discount / 100));
          } else {
            couponDiscount = coupon.discount;
          }
        }
      }

      const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
      const gstAmount = Math.round(discountedSubtotal * 0.18);
      const deliveryFee = fulfillmentMethod === 'DELIVERY' ? 99 : 0;
      const totalAmount = discountedSubtotal + gstAmount + deliveryFee;

      // 3. Create the Order
      const order = await tx.order.create({
        data: {
          userId,
          userEmail,
          userName,
          subtotal,
          gstAmount,
          deliveryFee,
          totalAmount,
          couponCode,
          couponDiscount,
          status: 'PENDING_PAYMENT',
          reservedUntil: new Date(Date.now() + 5 * 60 * 1000), // 5-minute TTL
          fulfillmentMethod,
          addressLine1,
          addressLine2,
          city,
          state,
          pincode,
          rentals: {
            create: lineItemsData
          }
        },
        include: {
          rentals: {
            include: {
              product: true
            }
          }
        }
      });

      return order;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      timeout: 5000
    });
  },

  // Verify Razorpay payment and commit stock changes
  async verifyPayment(orderId, paymentId, razorpayOrderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        rentals: true
      }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'PAID') {
      return serializeOrder(order); // Already processed
    }

    return await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id: orderId }
      });
      if (existing.status === 'PAID') {
        return existing;
      }

      // Process line items
      for (const item of order.rentals) {
        const qty = item.quantity || 1;
        // Move from reservedStock (decrement by qty)
        await tx.$executeRaw`
          UPDATE "products" 
          SET "reservedStock" = "reservedStock" - ${qty}
          WHERE id = ${item.productId}
        `;

        // Update rental item status to PENDING (submitted for approval)
        await tx.rental.update({
          where: { id: item.id },
          data: { status: 'PENDING' }
        });
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          razorpayPaymentId: paymentId,
          razorpayOrderId: razorpayOrderId
        },
        include: {
          rentals: {
            include: {
              product: true
            }
          }
        }
      });

      return updated;
    });
  },

  // Release expired reservations (background cron job)
  async releaseExpiredReservations() {
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING_PAYMENT',
        reservedUntil: { lt: new Date() }
      },
      include: {
        rentals: true
      }
    });

    if (expiredOrders.length === 0) return 0;

    await prisma.$transaction(async (tx) => {
      for (const order of expiredOrders) {
        for (const item of order.rentals) {
          const qty = item.quantity || 1;
          // Restore availableStock, subtract reservedStock
          await tx.$executeRaw`
            UPDATE "products" 
            SET "availableStock" = "availableStock" + ${qty},
                "reservedStock" = "reservedStock" - ${qty}
            WHERE id = ${item.productId}
          `;

          await tx.rental.update({
            where: { id: item.id },
            data: { status: 'CANCELLED' }
          });
        }

        await tx.order.update({
          where: { id: order.id },
          data: { status: 'EXPIRED' }
        });
      }
    });

    return expiredOrders.length;
  },
  // Create a new rental
  async create(data) {
    const { userId, userEmail, userName, productId, startDate, endDate, notes = '' } = data;
    
    // Check product availability
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    if (!product.isRentable) {
      throw new Error('This product is not available for rent');
    }
    
    if (product.availableStock < 1) {
      throw new Error('Product is currently out of stock');
    }
    
    // Calculate rental details
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    if (totalDays <= 0) {
      throw new Error('End date must be after start date');
    }
    
    const pricePerDay = Number(product.pricePerDay);
    const totalPrice = totalDays * pricePerDay;
    
    // Create rental in transaction
    const rental = await prisma.$transaction(async (tx) => {
      // Decrease available stock
      await tx.product.update({
        where: { id: productId },
        data: {
          availableStock: { decrement: 1 }
        }
      });
      
      // Create rental
      const newRental = await tx.rental.create({
        data: {
          userId,
          userEmail,
          userName,
          productId,
          startDate: start,
          endDate: end,
          totalDays,
          pricePerDay,
          totalPrice,
          notes,
          status: 'PENDING'
        },
        include: {
          product: true
        }
      });
      
      return newRental;
    });
    
    return serialize(rental);
  },
  
  // List rentals with filters
  async list({ page = 1, limit = 20, userId, status, search } = {}) {
    const where = {};
    
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { userEmail: { contains: search, mode: 'insensitive' } },
        { userName: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    const skip = (Math.max(1, +page) - 1) * Math.max(1, +limit);
    
    const [items, total] = await Promise.all([
      prisma.rental.findMany({
        where,
        include: {
          product: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Math.max(1, +limit)
      }),
      prisma.rental.count({ where })
    ]);
    
    return {
      items: items.map(serialize),
      total,
      page: +page,
      limit: +limit
    };
  },
  
  // Get rental by ID
  async getById(id) {
    const rental = await prisma.rental.findUnique({
      where: { id },
      include: {
        product: true
      }
    });
    return serialize(rental);
  },
  
  // Update rental status
  async updateStatus(id, status, adminUserId) {
    const rental = await prisma.rental.findUnique({
      where: { id }
    });
    
    if (!rental) {
      throw new Error('Rental not found');
    }

    if (rental.status === status) {
      const updatedRental = await prisma.rental.findUnique({
        where: { id },
        include: { product: true }
      });
      return serialize(updatedRental);
    }
    
    const updateData = { status };
    
    // Handle specific status transitions
    if (status === 'PICKED_UP') {
      updateData.pickupDate = new Date();
    } else if (status === 'RETURNED') {
      updateData.returnDate = new Date();
    }

    const qty = rental.quantity || 1;
    const isCurrentlyReturnedOrCancelled = rental.status === 'RETURNED' || rental.status === 'CANCELLED';
    const willBeReturnedOrCancelled = status === 'RETURNED' || status === 'CANCELLED';

    if (!isCurrentlyReturnedOrCancelled && willBeReturnedOrCancelled) {
      // Return actual quantity to available stock
      await prisma.product.update({
        where: { id: rental.productId },
        data: {
          availableStock: { increment: qty }
        }
      });
    } else if (isCurrentlyReturnedOrCancelled && !willBeReturnedOrCancelled) {
      // Re-deduct actual quantity from available stock if reverted to active
      await prisma.product.update({
        where: { id: rental.productId },
        data: {
          availableStock: { decrement: qty }
        }
      });
    }
    
    const updatedRental = await prisma.rental.update({
      where: { id },
      data: updateData,
      include: {
        product: true
      }
    });

    // Send email notifications on status transitions
    if (status === 'CONFIRMED') {
      NotificationsService.sendRentalConfirmation(updatedRental.userEmail, {
        orderId: updatedRental.id,
        productName: updatedRental.product?.name || 'Product',
        duration: `${updatedRental.totalDays} days`,
        amount: updatedRental.totalPrice
      }).catch(err => console.error('Failed to send rental confirmation email:', err));
    } else if (status === 'CANCELLED') {
      NotificationsService.sendRentalCancellation(updatedRental.userEmail, {
        orderId: updatedRental.id,
        productName: updatedRental.product?.name || 'Product'
      }).catch(err => console.error('Failed to send rental cancellation email:', err));
    }
    
    return serialize(updatedRental);
  },
  
  // Get user's active rental
  async getUserActiveRental(userId) {
    const rental = await prisma.rental.findFirst({
      where: {
        userId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'PICKED_UP']
        }
      },
      include: {
        product: true,
        order: {
          include: {
            rentals: {
              include: {
                product: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const serialized = serialize(rental);
    if (serialized && serialized.order && serialized.order.rentals) {
      serialized.order.rentals = serialized.order.rentals.map(serialize);
    }
    return serialized;
  },
  
  // Get user's rental history
  async getUserRentals(userId, { page = 1, limit = 10 } = {}) {
    const skip = (Math.max(1, +page) - 1) * Math.max(1, +limit);
    
    const [items, total] = await Promise.all([
      prisma.rental.findMany({
        where: { userId },
        include: {
          product: true,
          order: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Math.max(1, +limit)
      }),
      prisma.rental.count({ where: { userId } })
    ]);
    
    return {
      items: items.map(serialize),
      total,
      page: +page,
      limit: +limit
    };
  },
  
  // Check overdue rentals
  async checkOverdueRentals() {
    const now = new Date();
    const overdueRentals = await prisma.rental.updateMany({
      where: {
        status: 'PICKED_UP',
        endDate: { lt: now }
      },
      data: {
        status: 'OVERDUE'
      }
    });
    
    return overdueRentals;
  },

  // Create formal rental order
  async createFormalOrder(orderData, adminUserId) {
    const { rentalId, ...formData } = orderData;
    
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: { product: true }
    });
    
    if (!rental) {
      throw new Error('Rental not found');
    }
    
    // Update rental with formal order data
    const updatedRental = await prisma.rental.update({
      where: { id: rentalId },
      data: {
        status: 'CONFIRMED',
        notes: `${rental.notes}\n\nFormal Order Created:\n${JSON.stringify(formData, null, 2)}`
      },
      include: { product: true }
    });
    
    return serialize(updatedRental);
  },

  // ** FIXED: Generate PDF invoice and return the buffer **
  async generatePDFInvoice(rentalId, orderData = {}) {
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        product: true,
        order: {
          include: {
            rentals: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });
    
    if (!rental) {
      throw new Error('Rental not found');
    }
    
    try {
      // Use the loaded order details if present, otherwise fallback
      const finalOrderData = rental.order || orderData;
      
      // Generate PDF for the whole order
      const pdfBuffer = await PDFService.generateRentalInvoice(rental, finalOrderData);
      
      const filename = `rental_invoice_${rental.id}.pdf`;
      
      // Save the file for records
      await PDFService.savePDFToFile(pdfBuffer, filename);
      console.log(`📄 PDF generated and saved for order ${rental.orderId}: ${filename}`);
      
      return { pdfBuffer, filename };

    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  },

  // ** FIXED: Generate simple rental receipt PDF and return the buffer **
  async generateRentalReceipt(rentalId) {
    const rental = await this.getById(rentalId);
    
    if (!rental) {
      throw new Error('Rental not found');
    }
    
    try {
      // Generate PDF receipt
      const pdfBuffer = await PDFService.generateRentalReceipt(rental);
      
      const filename = `rental_receipt_${rental.id}.pdf`;
      
      // You can still save the file if you want a record of it
      await PDFService.savePDFToFile(pdfBuffer, filename);
      console.log(`📄 Receipt PDF generated and saved: ${filename}`);
      
      // ** CRUCIAL: Return the buffer and filename to the controller **
      return { pdfBuffer, filename };

    } catch (error) {
      console.error('Receipt PDF generation error:', error);
      throw new Error(`Failed to generate receipt PDF: ${error.message}`);
    }
  },

  // List all parent Orders (admin only)
  async listOrders({ page = 1, limit = 20, status, search } = {}) {
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { userName: { contains: search, mode: 'insensitive' } },
        { userEmail: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const skip = (Math.max(1, +page) - 1) * Math.max(1, +limit);
    
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          rentals: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Math.max(1, +limit)
      }),
      prisma.order.count({ where })
    ]);
    
    // Helper to serialize Decimal types in order record
    const serializeOrder = (order) => ({
      ...order,
      subtotal: Number(order.subtotal),
      gstAmount: Number(order.gstAmount),
      deliveryFee: Number(order.deliveryFee),
      totalAmount: Number(order.totalAmount),
      couponDiscount: order.couponDiscount ? Number(order.couponDiscount) : 0,
      rentals: order.rentals.map(r => ({
        ...r,
        pricePerDay: Number(r.pricePerDay),
        totalPrice: Number(r.totalPrice)
      }))
    });
    
    return {
      items: items.map(serializeOrder),
      total,
      page: +page,
      limit: +limit
    };
  },

  // Update whole parent Order status and synchronize child rentals (admin only)
  async updateOrderStatus(orderId, status) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { rentals: true }
    });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    const validStatuses = ['PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'CANCELLED', 'EXPIRED'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid order status');
    }
    
    return await prisma.$transaction(async (tx) => {
      // 1. Update Order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status },
        include: {
          rentals: {
            include: {
              product: true
            }
          }
        }
      });
      
      // Map Order status to RentalStatus
      let rentalStatus = 'RESERVED';
      if (status === 'CONFIRMED') rentalStatus = 'CONFIRMED';
      else if (status === 'PAID') rentalStatus = 'PENDING';
      else if (status === 'CANCELLED') rentalStatus = 'CANCELLED';
      else if (status === 'EXPIRED') rentalStatus = 'CANCELLED';
      
      // 2. Synchronize all child rentals status
      for (const item of order.rentals) {
        const updateData = { status: rentalStatus };
        
        if (status === 'CONFIRMED') {
          // If pickup, we don't dispatch shipping. But for record
          updateData.pickupDate = new Date();
        } else if (status === 'CANCELLED' || status === 'EXPIRED') {
          // Return product stock to available if order is cancelled or expired
          await tx.product.update({
            where: { id: item.productId },
            data: {
              availableStock: { increment: item.quantity || 1 }
            }
          });
        }
        
        await tx.rental.update({
          where: { id: item.id },
          data: updateData
        });
      }
      
      // Send notifications for order level events
      if (status === 'CONFIRMED') {
        NotificationsService.sendRentalConfirmation(updatedOrder.userEmail, {
          orderId: updatedOrder.id,
          productName: updatedOrder.rentals.map(r => `${r.product?.name} (x${r.quantity})`).join(', '),
          duration: `${updatedOrder.rentals[0]?.totalDays || 1} days`,
          amount: Number(updatedOrder.totalAmount)
        }).catch(err => console.error('Failed to send confirmation email:', err));
      } else if (status === 'CANCELLED') {
        NotificationsService.sendRentalCancellation(updatedOrder.userEmail, {
          orderId: updatedOrder.id,
          productName: updatedOrder.rentals.map(r => r.product?.name).join(', ')
        }).catch(err => console.error('Failed to send cancellation email:', err));
      }
      
      return updatedOrder;
    });
  }
};
