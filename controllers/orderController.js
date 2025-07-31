const db = require('../config/db');

// Get orders, items, and user name for a user
const getOrdersByUserId = (req, res) => {
  const userId = req.params.userId;

  const ordersQuery = `
    SELECT o.*, u.username AS username
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `;

  db.query(ordersQuery, [userId], async (err, orders) => {
    if (err) {
      console.error('Error fetching orders:', err);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    if (!orders.length) return res.json([]);

    try {
      const ordersWithItems = await Promise.all(
        orders.map(order => {
          return new Promise((resolve, reject) => {
            const itemsQuery = `
              SELECT p.name, oi.quantity, oi.price
              FROM order_items oi
              JOIN products p ON oi.product_id = p.id
              WHERE oi.order_id = ?
            `;
            db.query(itemsQuery, [order.id], (err, items) => {
              if (err) return reject(err);
              resolve({ ...order, items }); // includes order.username
            });
          });
        })
      );

      res.json(ordersWithItems);
    } catch (err) {
      console.error('Error fetching order items:', err);
      res.status(500).json({ error: 'Failed to fetch order items' });
    }
  });
};

module.exports = { getOrdersByUserId };
