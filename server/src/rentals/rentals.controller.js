import { RentalsService } from './rentals.service.js';
// No other imports are needed here, the service handles everything.

export const RentalsController = {
  // Create multi-item cart reservation (customer)
  reserve: async (req, res) => {
    try {
      const { items, fulfillmentMethod, addressLine1, addressLine2, city, state, pincode, couponCode } = req.body;
      const user = req.user;

      if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Cart items are required' });
      }

      const order = await RentalsService.createReservation({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        items,
        fulfillmentMethod,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        couponCode
      });

      console.log(`📝 Order reservation created: ${user.email} -> Order ID: ${order.id}`);
      res.status(201).json({ success: true, orderId: order.id, totalAmount: order.totalAmount });
    } catch (error) {
      console.error(`❌ Reservation creation failed:`, error.message);
      res.status(400).json({ message: error.message });
    }
  },

  // Create a new rental (customer)
  create: async (req, res) => {
    try {
      const { productId, startDate, endDate, notes } = req.body;
      const user = req.user;
      
      if (!productId || !startDate || !endDate) {
        return res.status(400).json({ 
          message: 'productId, startDate, and endDate are required' 
        });
      }
      
      const rental = await RentalsService.create({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        productId,
        startDate,
        endDate,
        notes
      });
      
      console.log(`📝 Rental created: ${user.email} -> ${rental.product?.name}`);
      res.status(201).json({ rental });
    } catch (error) {
      console.error(`❌ Rental creation failed:`, error.message);
      res.status(400).json({ message: error.message });
    }
  },
  
  // List all rentals (admin) or user's rentals (customer)
  list: async (req, res) => {
    try {
      const user = req.user;
      const { page, limit, status, search } = req.query;
      
      let options = { page, limit, status, search };
      
      // If not admin, only show user's own rentals
      if (user.role !== 'admin') {
        options.userId = user.id;
      }
      
      const result = await RentalsService.list(options);
      res.json(result);
    } catch (error) {
      console.error(`❌ Rental list failed:`, error.message);
      res.status(500).json({ message: 'Failed to fetch rentals' });
    }
  },
  
  // Get specific rental
  getOne: async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      
      const rental = await RentalsService.getById(id);
      
      if (!rental) {
        return res.status(404).json({ message: 'Rental not found' });
      }
      
      // Check permissions - users can only see their own rentals
      if (user.role !== 'admin' && rental.userId.toString() !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json({ rental });
    } catch (error) {
      console.error(`❌ Get rental failed:`, error.message);
      res.status(500).json({ message: 'Failed to fetch rental' });
    }
  },
  
  // Update rental status (admin only)
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const user = req.user;
      
      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }
      
      const validStatuses = ['PENDING', 'CONFIRMED', 'PICKED_UP', 'RETURNED', 'CANCELLED', 'OVERDUE'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      const rental = await RentalsService.updateStatus(id, status, user.id);
      
      console.log(`🔄 Rental status updated: ${rental.id} -> ${status}`);
      res.json({ rental });
    } catch (error) {
      console.error(`❌ Rental status update failed:`, error.message);
      res.status(400).json({ message: error.message });
    }
  },
  
  // Get user's active rental
  getActiveRental: async (req, res) => {
    try {
      const user = req.user;
      const rental = await RentalsService.getUserActiveRental(user.id);
      
      res.json({ rental });
    } catch (error) {
      console.error(`❌ Get active rental failed:`, error.message);
      res.status(500).json({ message: 'Failed to fetch active rental' });
    }
  },
  
  // Get user's rental history
  getMyRentals: async (req, res) => {
    try {
      const user = req.user;
      const { page, limit } = req.query;
      
      const result = await RentalsService.getUserRentals(user.id, { page, limit });
      res.json(result);
    } catch (error) {
      console.error(`❌ Get user rentals failed:`, error.message);
      res.status(500).json({ message: 'Failed to fetch rental history' });
    }
  },

  // Create formal rental order (admin)
  createOrder: async (req, res) => {
    try {
      const orderData = req.body;
      const user = req.user;
      
      const result = await RentalsService.createFormalOrder(orderData, user.id);
      res.json({ success: true, order: result });
    } catch (error) {
      console.error('Failed to create rental order:', error);
      res.status(400).json({ message: error.message });
    }
  },

  // ** ADDED LOGGING: Generate PDF and send the file to the browser **
  generatePDF: async (req, res) => {
    try {
      const { id } = req.params;
      const orderData = req.body || {};
      const user = req.user;

      const rental = await RentalsService.getById(id);
      if (!rental) {
        return res.status(404).json({ message: 'Rental not found' });
      }

      if (user.role !== 'admin' && rental.userId.toString() !== user.id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      console.log(`[Controller] 📄 Generating PDF for rental: ${id}`);
      
      // The service now returns the PDF data directly
      const result = await RentalsService.generatePDFInvoice(id, orderData);
      
      if (!result || !result.pdfBuffer || !result.filename) {
        console.error('[Controller] ❌ Service did not return valid PDF data.');
        return res.status(500).json({ message: 'Failed to get PDF data from service.' });
      }
      
      const { pdfBuffer, filename } = result;
      
      console.log(`[Controller] ✅ PDF data received. Buffer size: ${pdfBuffer.length} bytes. Filename: ${filename}`);

      // Set the correct headers to trigger a download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      console.log('[Controller] 🚀 Sending PDF to browser...');
      // Send the actual PDF data in the response
      res.send(pdfBuffer);

    } catch (error) {
      console.error('[Controller] ❌ PDF generation failed:', error.message);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to generate PDF'
      });
    }
  },

  // Generate and download PDF receipt
  downloadPDF: async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const rental = await RentalsService.getById(id);
      if (!rental) {
        return res.status(404).json({ message: 'Rental not found' });
      }

      if (user.role !== 'admin' && rental.userId.toString() !== user.id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      console.log(`[Controller] 📥 Generating PDF download for rental: ${id}`);
      
      const { pdfBuffer, filename } = await RentalsService.generateRentalReceipt(id);
      
      if (!pdfBuffer || !filename) {
        console.error('[Controller] ❌ Service did not return valid PDF receipt data.');
        return res.status(500).json({ message: 'Failed to get PDF receipt data from service.' });
      }
      
      console.log(`[Controller] ✅ PDF receipt data received. Buffer size: ${pdfBuffer.length} bytes. Filename: ${filename}`);
      
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      console.log('[Controller] 🚀 Sending PDF receipt to browser...');
      // Send PDF buffer
      res.send(pdfBuffer);
    } catch (error) {
      console.error('[Controller] ❌ PDF download failed:', error.message);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to download PDF'
      });
    }
  },

  // Validate coupon (customer checkout)
  validateCoupon: async (req, res) => {
    try {
      const { code, rentalTotal } = req.body;
      if (!code) {
        return res.status(400).json({ valid: false, message: 'Coupon code is required' });
      }

      const validCoupons = {
        'SAVE10': { discount: 10, type: 'percentage', description: '10% off on your total rental cost' },
        'FIRST50': { discount: 50, type: 'fixed', description: '₹50 flat discount' },
        'WELCOME': { discount: 5, type: 'percentage', description: '5% off welcome bonus' },
        'FESTIVE20': { discount: 20, type: 'percentage', description: '20% off festival special' }
      };

      const coupon = validCoupons[code.toUpperCase()];
      if (!coupon) {
        return res.status(400).json({ valid: false, message: 'Invalid coupon code' });
      }

      return res.json({
        valid: true,
        code: code.toUpperCase(),
        discount: coupon.discount,
        type: coupon.type,
        description: coupon.description
      });
    } catch (error) {
      console.error('Failed to validate coupon:', error);
      res.status(500).json({ valid: false, message: 'Failed to validate coupon' });
    }
  },

  // List all orders (admin only)
  listOrders: async (req, res) => {
    try {
      const { page, limit, status, search } = req.query;
      const result = await RentalsService.listOrders({ page, limit, status, search });
      res.json(result);
    } catch (error) {
      console.error(`❌ Order list failed:`, error.message);
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  },

  // Update order status (admin only)
  updateOrderStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }
      
      const order = await RentalsService.updateOrderStatus(id, status);
      res.json({ success: true, order });
    } catch (error) {
      console.error(`❌ Order status update failed:`, error.message);
      res.status(400).json({ message: error.message });
    }
  }
};
