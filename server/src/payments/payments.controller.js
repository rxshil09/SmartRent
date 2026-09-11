import { PaymentsService } from './payments.service.js';
import { RentalsService } from '../rentals/rentals.service.js';
import { prisma } from '../db/postgres.js';
import crypto from 'crypto';

export const PaymentsController = {
  createRazorpayOrder: async (req, res) => {
    try {
      const { orderId, amount: directAmount } = req.body;
      
      if (!orderId && !directAmount) {
        return res.status(400).json({ message: 'OrderId or amount is required' });
      }

      let amount;
      let razorpayOrderId;

      if (orderId) {
        // Fetch order details from database
        const order = await prisma.order.findUnique({
          where: { id: orderId }
        });
        if (!order) {
          return res.status(404).json({ message: 'Order not found' });
        }

        amount = Number(order.totalAmount);
        const razorpayOrder = await PaymentsService.createRazorpayOrder(amount);
        razorpayOrderId = razorpayOrder.id;
        
        // Update our order with the Razorpay order ID
        await prisma.order.update({
          where: { id: orderId },
          data: { razorpayOrderId: razorpayOrder.id }
        });
      } else {
        // Direct amount checkout (single product checkout page)
        amount = Number(directAmount);
        if (isNaN(amount) || amount <= 0) {
          return res.status(400).json({ message: 'Invalid amount' });
        }
        const razorpayOrder = await PaymentsService.createRazorpayOrder(amount);
        razorpayOrderId = razorpayOrder.id;
      }

      res.json({
        orderId: razorpayOrderId,
        amount: Math.round(amount * 100), // amount in paise for Razorpay frontend
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error('❌ Razorpay order creation failed:', error.message);
      res.status(500).json({ message: 'Payment initialization failed' });
    }
  },

  verifyRazorpayPayment: async (req, res) => {
    try {
      const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
      if (!orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
        return res.status(400).json({ message: 'All payment parameters are required' });
      }

      // Verify the Razorpay signature
      const text = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(text)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        return res.status(400).json({ message: 'Invalid payment signature' });
      }

      // Verify payment and update stock on backend
      const updatedOrder = await RentalsService.verifyPayment(orderId, razorpayPaymentId, razorpayOrderId);

      res.json({ success: true, order: updatedOrder });
    } catch (error) {
      console.error('❌ Razorpay signature verification failed:', error.message);
      res.status(500).json({ message: error.message || 'Payment verification failed' });
    }
  },

  handleRazorpayWebhook: async (req, res) => {
    try {
      const signature = req.headers['x-razorpay-signature'];
      if (!signature) {
        return res.status(400).json({ message: 'Signature missing' });
      }

      const expectedSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret_key';
      const shasum = crypto.createHmac('sha256', expectedSecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');

      if (digest !== signature) {
        return res.status(400).json({ message: 'Signature verification failed' });
      }

      const event = req.body.event;
      if (event === 'payment.captured') {
        const { order_id: razorpayOrderId, id: paymentId } = req.body.payload.payment.entity;
        
        // Find our order by the Razorpay Order ID
        const order = await prisma.order.findUnique({
          where: { razorpayOrderId }
        });
        
        if (order && order.status === 'PENDING_PAYMENT') {
          await RentalsService.verifyPayment(order.id, paymentId, razorpayOrderId);
          console.log(`✅ Webhook: Order ${order.id} verified and updated.`);
        }
      }

      res.json({ status: 'ok' });
    } catch (error) {
      console.error('❌ Webhook error:', error.message);
      res.status(500).json({ message: 'Webhook handler failed' });
    }
  }
};
