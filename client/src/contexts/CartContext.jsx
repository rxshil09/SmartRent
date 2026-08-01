/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('sr_cart');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [fulfillmentMethod, setFulfillmentMethod] = useState('PICKUP'); // 'PICKUP' or 'DELIVERY'
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);

  useEffect(() => {
    localStorage.setItem('sr_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, startDate, endDate, notes = '', quantity = 1) => {
    setCart((prev) => {
      // If product already in cart, replace it (keeping the new dates/qty)
      const filtered = prev.filter((item) => item.id !== product.id);
      return [
        ...filtered,
        {
          id: product.id,
          name: product.name,
          image: product.images?.[0] || '',
          pricePerDay: Number(product.pricePerDay),
          startDate,
          endDate,
          notes,
          quantity: Math.max(1, Math.min(quantity, product.availableStock || 10)),
          availableStock: product.availableStock || 0,
          category: product.category,
          brand: product.brand
        }
      ];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateCartItemDates = (productId, startDate, endDate) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, startDate, endDate } : item
      )
    );
  };

  const updateCartItemNotes = (productId, notes) => {
    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, notes } : item))
    );
  };

  const updateCartItemQuantity = (productId, quantity) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.availableStock || 10)) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setCouponCode('');
    setCouponDiscount(0);
    setFulfillmentMethod('PICKUP');
  };

  // Calculations (quantity-aware)
  const calculateDays = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    return Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1); // inclusive
  };

  const subtotal = cart.reduce((acc, item) => {
    const days = calculateDays(item.startDate, item.endDate);
    const qty = item.quantity || 1;
    return acc + item.pricePerDay * days * qty;
  }, 0);

  // Dynamic coupon verification helper (client-side prediction)
  useEffect(() => {
    if (!couponCode) {
      setCouponDiscount(0);
      return;
    }
    const code = couponCode.toUpperCase();
    if (code === 'SAVE10') {
      setCouponDiscount(Math.round(subtotal * 0.10));
    } else if (code === 'FIRST50') {
      setCouponDiscount(50);
    } else if (code === 'WELCOME') {
      setCouponDiscount(Math.round(subtotal * 0.05));
    } else if (code === 'FESTIVE20') {
      setCouponDiscount(Math.round(subtotal * 0.20));
    } else {
      setCouponDiscount(0);
    }
  }, [couponCode, subtotal]);

  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
  const gstAmount = Math.round(discountedSubtotal * 0.18);
  const deliveryFee = fulfillmentMethod === 'DELIVERY' ? 99 : 0;
  const totalAmount = discountedSubtotal + gstAmount + deliveryFee;

  return (
    <CartContext.Provider
      value={{
        cart,
        fulfillmentMethod,
        setFulfillmentMethod,
        couponCode,
        setCouponCode,
        couponDiscount,
        subtotal,
        gstAmount,
        deliveryFee,
        totalAmount,
        addToCart,
        removeFromCart,
        updateCartItemDates,
        updateCartItemNotes,
        updateCartItemQuantity,
        clearCart,
        calculateDays
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
