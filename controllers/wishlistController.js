const fs = require('fs');
const path = require('path');
const db = require("../config/db");

// ✅ Helper: Convert image path from DB to Base64
const getBase64Image = (filename) => {
  if (!filename) return null;

  try {
    // Clean path: remove unwanted prefixes
    let safeFilename = filename
      .replace(/^\/+/, '')         // remove starting slashes
      .replace(/^(\.\.\/)+/, '')   // remove ../
      .replace(/^assets\//, '')    // remove assets/ prefix

    // Possible storage locations
    const possiblePaths = [
      path.join(__dirname, '../../public/assets', safeFilename)
    ];

    let imagePath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        imagePath = p;
        break;
      }
    }

    if (!imagePath) {
      console.warn(`⚠️ Wishlist image not found for: ${filename}`);
      return null;
    }

    const imgData = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath).slice(1).toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    return `data:${mimeType};base64,${imgData.toString('base64')}`;
  } catch (error) {
    console.error(`❌ Error converting wishlist image: ${filename}`, error);
    return null;
  }
};

// ✅ Add to wishlist
exports.addToWishlist = (req, res) => {
  const { userId, productId } = req.body;
  const checkQuery = "SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?";
  const insertQuery = "INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)";

  db.query(checkQuery, [userId, productId], (err, results) => {
    if (err) {
      console.error("Check wishlist error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length > 0) {
      return res.status(200).json({ message: "Already in wishlist" });
    }

    db.query(insertQuery, [userId, productId], (err2) => {
      if (err2) {
        console.error("Insert wishlist error:", err2);
        return res.status(500).json({ error: "Insert failed" });
      }

      res.status(201).json({ message: "Added to wishlist" });
    });
  });
};

// ✅ Get wishlist by user ID (with product details & Base64 images)
exports.getWishlistByUser = (req, res) => {
  const { userId } = req.params;

  const query = `
    SELECT w.product_id, p.name AS title, p.image_url AS image, p.price
    FROM wishlist w
    JOIN products p ON w.product_id = p.id
    WHERE w.user_id = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Fetch wishlist error:", err);
      return res.status(500).json({ error: "Failed to fetch wishlist" });
    }

    const updatedResults = results.map(item => {
      item.image = getBase64Image(item.image);
      return item;
    });

    res.json(updatedResults);
  });
};

// ✅ Remove from wishlist
exports.removeFromWishlist = (req, res) => {
  const { userId, productId } = req.params;
  const query = "DELETE FROM wishlist WHERE user_id = ? AND product_id = ?";

  db.query(query, [userId, productId], (err, result) => {
    if (err) {
      console.error("Error removing from wishlist:", err);
      return res.status(500).json({ error: "Failed to remove item from wishlist" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Item not found in wishlist" });
    }

    res.status(200).json({ message: "Item removed from wishlist" });
  });
};
