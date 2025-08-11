const fs = require('fs');
const path = require('path');
const db = require('../config/db');

// ✅ Get cart items and convert images to Base64
const getCart = (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT c.product_id AS id, p.name, p.description, p.price, p.stock, p.image_url, c.quantity AS qty
    FROM cart_items c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching cart:', err);
      return res.status(500).json({ error: 'Failed to fetch cart' });
    }

    // ✅ Convert image paths to Base64
    const updatedResults = results.map(item => {
      if (item.image_url) {
        try {
          // Resolve absolute image path
          const imagePath = path.resolve(__dirname, '../../public/assets', item.image_url);

          if (fs.existsSync(imagePath)) {
            const imageData = fs.readFileSync(imagePath);
            const ext = path.extname(imagePath).slice(1); // e.g. png, jpg
            item.image_url = `data:image/${ext};base64,${imageData.toString('base64')}`;
          } else {
            console.warn(`Image not found: ${imagePath}`);
            item.image_url = null;
          }
        } catch (error) {
          console.error('Error converting image to Base64:', error);
          item.image_url = null;
        }
      }
      return item;
    });

    res.json(updatedResults);
  });
};


// Add product to cart (increment if exists)
const addToCart = (req, res) => {
  const { userId, productId } = req.body;

  const checkQuery = 'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?';
  db.query(checkQuery, [userId, productId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    if (results.length > 0) {
      // Product already in cart – increment quantity
      const updateQuery = 'UPDATE cart_items SET quantity = quantity + 1 WHERE user_id = ? AND product_id = ?';
      db.query(updateQuery, [userId, productId], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to update cart' });
        res.json({ message: 'Cart updated' });
      });
    } else {
      // Insert new product into cart
      const insertQuery = 'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, 1)';
      db.query(insertQuery, [userId, productId], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to add to cart' });
        res.json({ message: 'Product added to cart' });
      });
    }
  });
};

// Remove product from cart (decrement or remove)
const removeFromCart = (req, res) => {
  const { userId, productId } = req.body;

  const checkQuery = 'SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?';
  db.query(checkQuery, [userId, productId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    if (results.length === 0) {
      return res.status(404).json({ error: 'Product not in cart' });
    }

    const currentQty = results[0].quantity;
    if (currentQty > 1) {
      const updateQuery = 'UPDATE cart_items SET quantity = quantity - 1 WHERE user_id = ? AND product_id = ?';
      db.query(updateQuery, [userId, productId], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to update quantity' });
        res.json({ message: 'Quantity decreased' });
      });
    } else {
      const deleteQuery = 'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?';
      db.query(deleteQuery, [userId, productId], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to remove item' });
        res.json({ message: 'Product removed from cart' });
      });
    }
  });
};

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
};
