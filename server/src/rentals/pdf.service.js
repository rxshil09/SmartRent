import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PDFService = {
  async generateRentalInvoice(rental, orderData = {}) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    try {
      const page = await browser.newPage();
      
      // Generate HTML content for the invoice
      const htmlContent = this.generateInvoiceHTML(rental, orderData);
      
      // Set viewport for consistent rendering
      await page.setViewport({ width: 1200, height: 800 });
      
      // ** FIXED: Changed waitUntil to 'domcontentloaded' to prevent timeout **
      await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });
      
      return pdfBuffer;
    } finally {
      await browser.close();
    }
  },

  generateInvoiceHTML(rental, orderData = {}) {
    const formatCurrency = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;
    const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');
    
    // Check if orderData is populated from our Prisma query containing order relations
    const orderItems = orderData.rentals || [];
    
    const untaxedTotal = orderData.subtotal !== undefined ? Number(orderData.subtotal) : Number(rental.pricePerDay || 0) * (rental.totalDays || 1) * (rental.quantity || 1);
    const tax = orderData.gstAmount !== undefined ? Number(orderData.gstAmount) : Math.round(untaxedTotal * 0.18);
    const delivery = orderData.deliveryFee !== undefined ? Number(orderData.deliveryFee) : 0;
    const discount = orderData.couponDiscount !== undefined ? Number(orderData.couponDiscount) : 0;
    const total = orderData.totalAmount !== undefined ? Number(orderData.totalAmount) : (untaxedTotal + tax + delivery - discount);
    
    let itemsHtml = '';
    if (orderItems.length > 0) {
      orderItems.forEach(item => {
        const itemQty = item.quantity || 1;
        const itemPricePerDay = Number(item.pricePerDay || 0);
        const itemDays = item.totalDays || 1;
        const itemSubtotal = itemPricePerDay * itemDays * itemQty;
        const itemTax = Math.round(itemSubtotal * 0.18);
        
        itemsHtml += `
          <tr>
            <td><strong>${item.product?.name || 'Rental Product'}</strong></td>
            <td>${item.product?.category || 'General'}</td>
            <td class="center">${itemQty}</td>
            <td class="number">${formatCurrency(itemPricePerDay)}</td>
            <td class="center">${itemDays}</td>
            <td class="number">${formatCurrency(itemTax)}</td>
            <td class="number"><strong>${formatCurrency(itemSubtotal)}</strong></td>
          </tr>
        `;
      });
    } else {
      // Fallback if order details are missing
      const fallbackPrice = Number(rental.pricePerDay || 0);
      const fallbackDays = rental.totalDays || 1;
      const fallbackQty = rental.quantity || 1;
      const fallbackSub = fallbackPrice * fallbackDays * fallbackQty;
      const fallbackTax = Math.round(fallbackSub * 0.18);
      
      itemsHtml = `
        <tr>
          <td><strong>${rental.product?.name || 'Rental Product'}</strong></td>
          <td>${rental.product?.category || 'General'}</td>
          <td class="center">${fallbackQty}</td>
          <td class="number">${formatCurrency(fallbackPrice)}</td>
          <td class="center">${fallbackDays}</td>
          <td class="number">${formatCurrency(fallbackTax)}</td>
          <td class="number"><strong>${formatCurrency(fallbackSub)}</strong></td>
        </tr>
      `;
    }
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Rental Invoice - INV-${rental.id.slice(0, 8).toUpperCase()}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
          color: #334155; 
          background: white;
          font-size: 13px;
          line-height: 1.5;
        }
        .invoice { 
          max-width: 800px; 
          margin: 0 auto; 
          background: white;
          padding: 40px;
        }
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start;
          border-bottom: 2px solid #f1f5f9;
          padding-bottom: 25px;
          margin-bottom: 30px;
        }
        .brand {
          display: flex;
          flex-direction: column;
        }
        .logo { 
          font-size: 24px; 
          font-weight: 800; 
          color: #1e3a8a;
          letter-spacing: -0.025em;
          text-transform: uppercase;
        }
        .logo-sub {
          font-size: 11px;
          color: #64748b;
          margin-top: 2px;
          font-weight: 500;
        }
        .invoice-details { 
          text-align: right; 
        }
        .invoice-title { 
          font-size: 22px; 
          font-weight: 800; 
          color: #0f172a;
          margin-bottom: 5px; 
          letter-spacing: -0.025em;
        }
        .invoice-number { 
          font-size: 13px; 
          font-weight: 600;
          color: #475569;
        }
        .info-section { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 50px; 
          margin-bottom: 35px; 
        }
        .info-group h3 { 
          color: #0f172a; 
          font-size: 12px; 
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px; 
          padding-bottom: 6px; 
          border-bottom: 1px solid #e2e8f0; 
        }
        .info-row { 
          display: flex; 
          margin-bottom: 6px; 
        }
        .info-label { 
          font-weight: 500; 
          width: 100px; 
          color: #64748b; 
        }
        .info-value { 
          color: #334155; 
          font-weight: 600;
          flex: 1; 
        }
        .items-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 30px; 
        }
        .items-table th { 
          background: #f8fafc; 
          color: #475569; 
          padding: 12px 14px; 
          text-align: left; 
          font-weight: 700; 
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #cbd5e1;
        }
        .items-table td { 
          padding: 14px; 
          border-bottom: 1px solid #f1f5f9; 
          color: #334155;
          font-size: 13px;
        }
        .items-table td.number {
          text-align: right;
        }
        .items-table td.center {
          text-align: center;
        }
        .totals-section { 
          display: flex; 
          justify-content: flex-end; 
          margin-bottom: 35px; 
        }
        .totals-box { 
          width: 320px; 
        }
        .total-row { 
          display: flex; 
          justify-content: space-between; 
          padding: 8px 0;
          color: #475569;
          font-size: 13px;
        }
        .total-row.final { 
          border-top: 1px solid #e2e8f0; 
          padding-top: 12px; 
          margin-top: 8px; 
          font-weight: 800; 
          font-size: 16px; 
          color: #1e3a8a; 
        }
        .notes-section { 
          background: #f8fafc; 
          padding: 20px; 
          border-radius: 12px; 
          border-left: 4px solid #1e3a8a; 
          margin-bottom: 25px; 
        }
        .notes-title { 
          font-size: 12px; 
          font-weight: 700; 
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px; 
          color: #0f172a; 
        }
        .notes-body {
          color: #475569;
          font-size: 12px;
          line-height: 1.6;
        }
        .footer { 
          text-align: center; 
          padding-top: 30px; 
          border-top: 1px solid #f1f5f9; 
          color: #94a3b8; 
          font-size: 11px; 
        }
        .status-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }
        .status-confirmed { background-color: #dcfce7; color: #15803d; }
        .status-pending { background-color: #fef3c7; color: #b45309; }
        .status-picked_up { background-color: #dbeafe; color: #1d4ed8; }
        .status-returned { background-color: #f1f5f9; color: #475569; }
        .status-cancelled { background-color: #fee2e2; color: #b91c1c; }
      </style>
    </head>
    <body>
      <div class="invoice">
        <div class="header">
          <div class="brand">
            <div class="logo">SmartRent</div>
            <div class="logo-sub">Professional Rental Solutions</div>
          </div>
          <div class="invoice-details">
            <div class="invoice-title">RENTAL INVOICE</div>
            <div class="invoice-number">Invoice #: INV-${rental.id.slice(0, 8).toUpperCase()}</div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-group">
            <h3>Customer Information</h3>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span class="info-value">${rental.userName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${rental.userEmail}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="info-value">
                <span class="status-badge status-${rental.status.toLowerCase()}">${rental.status}</span>
              </span>
            </div>
          </div>
          <div class="info-group">
            <h3>Order Information</h3>
            <div class="info-row">
              <span class="info-label">Order Date:</span>
              <span class="info-value">${formatDate(rental.createdAt)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fulfillment:</span>
              <span class="info-value">${orderData.fulfillmentMethod === 'DELIVERY' ? 'Home Delivery' : 'Store Pickup'}</span>
            </div>
            ${orderData.id ? `
            <div class="info-row">
              <span class="info-label">Order Ref:</span>
              <span class="info-value">ORD-${orderData.id.slice(0, 8).toUpperCase()}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th class="center">Qty</th>
              <th class="number">Price/Day</th>
              <th class="center">Days</th>
              <th class="number">Tax (GST 18%)</th>
              <th class="number">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="totals-box">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(untaxedTotal)}</span>
            </div>
            <div class="total-row">
              <span>Delivery Charge:</span>
              <span>${delivery === 0 ? 'FREE' : formatCurrency(delivery)}</span>
            </div>
            <div class="total-row">
              <span>GST Tax (18%):</span>
              <span>${formatCurrency(tax)}</span>
            </div>
            ${discount > 0 ? `
            <div class="total-row" style="color: #16a34a; font-weight: 700;">
              <span>Coupon Discount ${orderData.couponCode ? `(${orderData.couponCode})` : ''}:</span>
              <span>−${formatCurrency(discount)}</span>
            </div>
            ` : ''}
            <div class="total-row final">
              <span>Total Paid:</span>
              <span>${formatCurrency(total)}</span>
            </div>
          </div>
        </div>
        
        ${rental.notes ? `
        <div class="notes-section">
          <div class="notes-title">Special Instructions</div>
          <div class="notes-body">${rental.notes}</div>
        </div>
        ` : ''}
        
        <div class="notes-section">
          <div class="notes-title">Terms & Conditions</div>
          <div class="notes-body">${orderData.termsConditions || 'Standard terms and conditions apply for this rental agreement. Product must be returned in the same condition as received. Late returns incur additional charges of ₹100 per day. Security deposit may be required for high-value items.'}</div>
        </div>
        
        <div class="footer">
          <p><strong>SmartRent</strong> - Professional Rental Management Platform</p>
          <p>Generated on ${formatDate(new Date())} | Invoice #INV-${rental.id.slice(0, 8).toUpperCase()}</p>
          <p>For support: support@smartrent.com | +91 98765 43210</p>
        </div>
      </div>
    </body>
    </html>
    `;
  },

  // Generate a simple rental receipt PDF
  async generateRentalReceipt(rental) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    try {
      const page = await browser.newPage();
      
      const htmlContent = this.generateReceiptHTML(rental);
      
      // ** FIXED: Changed waitUntil to 'domcontentloaded' to prevent timeout **
      await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
      });
      
      return pdfBuffer;
    } finally {
      await browser.close();
    }
  },

  generateReceiptHTML(rental) {
    const formatCurrency = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;
    const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Rental Receipt - R${rental.id.slice(0, 6)}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
          color: #334155; 
          background: white;
          font-size: 13px;
          line-height: 1.5;
          padding: 30px;
        }
        .receipt { 
          max-width: 600px; 
          margin: 0 auto; 
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
        }
        .header { 
          background: #f8fafc; 
          padding: 25px 30px; 
          border-bottom: 1px dashed #e2e8f0;
          text-align: center; 
        }
        .logo { 
          font-size: 22px; 
          font-weight: 800; 
          color: #1e3a8a;
          text-transform: uppercase;
          letter-spacing: -0.025em;
        }
        .receipt-title {
          font-size: 11px;
          color: #64748b;
          margin-top: 4px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .content { 
          padding: 30px; 
        }
        .section { 
          margin-bottom: 24px; 
        }
        .section h3 { 
          color: #0f172a; 
          font-size: 12px; 
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px; 
          padding-bottom: 6px; 
          border-bottom: 1px solid #e2e8f0; 
        }
        .detail-row { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 6px; 
        }
        .detail-label { 
          font-weight: 500; 
          color: #64748b; 
        }
        .detail-value { 
          font-weight: 600;
          color: #334155; 
        }
        .product-section {
          background: #f8fafc;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          border: 1px solid #f1f5f9;
        }
        .product-title {
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .total-section {
          background: #f0fdf4;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #bcf0da;
        }
        .total-title {
          font-size: 12px;
          font-weight: 700;
          color: #14532d;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .total-amount {
          font-size: 20px;
          font-weight: 800;
          color: #15803d;
          text-align: center;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px dashed #bcf0da;
        }
        .footer {
          text-align: center;
          padding: 25px 30px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          color: #94a3b8;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="logo">SmartRent</div>
          <div class="receipt-title">Payment Receipt #REC-${rental.id.slice(0, 8).toUpperCase()}</div>
        </div>
        
        <div class="content">
          <div class="section">
            <h3>Customer Details</h3>
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">${rental.userName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value">${rental.userEmail}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Receipt Date:</span>
              <span class="detail-value">${formatDate(new Date())}</span>
            </div>
          </div>
          
          <div class="product-section">
            <div class="product-title">Rented Item</div>
            <div class="detail-row">
              <span class="detail-label">Product Name:</span>
              <span class="detail-value">${rental.product?.name || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Category:</span>
              <span class="detail-value">${rental.product?.category || 'General'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Brand:</span>
              <span class="detail-value">${rental.product?.brand || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Condition:</span>
              <span class="detail-value">${rental.product?.condition || 'Good'}</span>
            </div>
          </div>
          
          <div class="section">
            <h3>Rental Duration</h3>
            <div class="detail-row">
              <span class="detail-label">Start Date:</span>
              <span class="detail-value">${formatDate(rental.startDate)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">End Date:</span>
              <span class="detail-value">${formatDate(rental.endDate)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Total Duration:</span>
              <span class="detail-value">${rental.totalDays} days</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Rental Status:</span>
              <span class="detail-value" style="color: #1e3a8a; font-weight: 700;">${rental.status}</span>
            </div>
          </div>
          
          <div class="total-section">
            <div class="total-title">Payment Breakup</div>
            <div class="detail-row">
              <span class="detail-label" style="color: #475569;">Rate per Day:</span>
              <span class="detail-value" style="color: #334155;">${formatCurrency(rental.pricePerDay)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label" style="color: #475569;">Quantity:</span>
              <span class="detail-value" style="color: #334155;">${qty}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label" style="color: #475569;">Subtotal:</span>
              <span class="detail-value" style="color: #334155;">${formatCurrency(Number(rental.pricePerDay) * rental.totalDays * qty)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label" style="color: #475569;">GST (18%):</span>
              <span class="detail-value" style="color: #334155;">${formatCurrency(Math.round(Number(rental.pricePerDay) * rental.totalDays * qty * 0.18))}</span>
            </div>
            <div class="total-amount">
              Paid Amount: ${formatCurrency(rental.totalPrice)}
            </div>
          </div>
          
          ${rental.notes ? `
          <div class="section" style="margin-top: 24px;">
            <h3 style="color: #0f172a; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0;">Special Instructions</h3>
            <p style="background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 12px; color: #475569;">${rental.notes}</p>
          </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p><strong>SmartRent</strong> - Professional Rental Management</p>
          <p>Thank you for choosing SmartRent!</p>
          <p>Support: support@smartrent.com | +91 98765 43210</p>
        </div>
      </div>
    </body>
    </html>
    `;
  },

  // Save PDF to file system (for download)
  async savePDFToFile(pdfBuffer, filename) {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, pdfBuffer);
    
    return filePath;
  }
};
