const db = require('../config/db');
const Razorpay = require('razorpay');
require('dotenv').config();

// ✅ Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Create Razorpay Order
const createRazorpayOrder = async (req, res) => {
  const { total } = req.body;

  if (!total || isNaN(total)) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const options = {
    amount: total * 100, // amount in paise
    currency: 'INR',
    receipt: `receipt_order_${Math.floor(Math.random() * 1000000)}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
};

// ✅ Get saved addresses
const getAddresses = (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT DISTINCT address 
    FROM orders 
    WHERE user_id = ? 
    ORDER BY id DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching addresses:', err);
      return res.status(500).json({ error: 'Failed to retrieve addresses' });
    }

    const addressList = results.map(row => row.address);
    res.json(addressList);
  });
};

// ✅ Place Order
const placeOrder = (req, res) => {
  const { userId, cartItems, address, paymentMethod, total, name, phone_no } = req.body;

  if (!userId || !Array.isArray(cartItems) || cartItems.length === 0 || !address || !paymentMethod || total == null || !name || !phone_no) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // 1. Insert into orders table
  const orderQuery = `
    INSERT INTO orders (user_id, name, phone_no, address, payment_method, total)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(orderQuery, [userId, name, phone_no, address, paymentMethod, total], (err, result) => {
    if (err) {
      console.error('Error inserting order:', err);
      return res.status(500).json({ error: 'Failed to place order' });
    }

    const orderId = result.insertId;

    // 2. Insert into order_items
    const orderItemsQuery = `
      INSERT INTO order_items (order_id, product_id, quantity, price)
      VALUES ?
    `;

    const orderItemsData = cartItems.map(item => [
      orderId,
      item.id,
      item.qty,
      item.price
    ]);

    db.query(orderItemsQuery, [orderItemsData], (err) => {
      if (err) {
        console.error('Failed to insert order items:', err);
        return res.status(500).json({ error: 'Failed to save order items' });
      }

      // 3. Update product stock
      const updateStockPromises = cartItems.map(item => {
        return new Promise((resolve, reject) => {
          const updateStockQuery = `
            UPDATE products
            SET stock = stock - ?
            WHERE id = ? AND stock >= ?
          `;
          db.query(updateStockQuery, [item.qty, item.id, item.qty], (err, result) => {
            if (err) return reject(`Error updating stock for product ${item.id}`);
            if (result.affectedRows === 0) return reject(`Insufficient stock for product ${item.id}`);
            resolve();
          });
        });
      });
      Promise.all(updateStockPromises)
  .then(() => {
    // ✅ Clear cart
    const clearCartQuery = `DELETE FROM cart_items WHERE user_id = ?`;
    db.query(clearCartQuery, [userId], (err) => {
      if (err) {
        console.error('Error clearing cart:', err);
        // Don't return error to user
      }
    });

    res.status(201).json({ message: 'Order placed successfully', orderId });
  })
  .catch(stockErr => {
    console.error(stockErr);
    res.status(400).json({ error: stockErr });
  });

    });
  });
};

// ✅ Get latest order with items
const getLatestOrder = (req, res) => {
  const userId = req.params.userId;

  const latestOrderQuery = `
    SELECT * FROM orders
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `;

  db.query(latestOrderQuery, [userId], (err, orderResults) => {
    if (err) {
      console.error('Error fetching latest order:', err);
      return res.status(500).json({ error: 'Failed to fetch latest order' });
    }

    if (orderResults.length === 0) {
      return res.status(404).json({ error: 'No orders found' });
    }

    const latestOrder = orderResults[0];

    const itemsQuery = `
      SELECT oi.product_id, p.name, oi.quantity AS qty, oi.price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `;

    db.query(itemsQuery, [latestOrder.id], (err, itemResults) => {
      if (err) {
        console.error('Error fetching order items:', err);
        return res.status(500).json({ error: 'Failed to fetch order items' });
      }

      return res.json({
        order: {
          ...latestOrder,
          items: itemResults,
        },
      });
    });
  });
};

module.exports = {
  createRazorpayOrder,
  getAddresses,
  placeOrder,
  getLatestOrder,
};
