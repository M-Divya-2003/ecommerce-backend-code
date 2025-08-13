const fs = require('fs');
const path = require('path');
const db = require("../config/db");

// ✅ Helper to convert image filename to Base64
const fileToBase64 = (filename) => {
  if (!filename) return null;

  // Remove any "../" or "/" to avoid path traversal
  const safeFilename = path.basename(filename);

  // Absolute path to public/assets folder
  const imagePath = path.join(__dirname, '..', 'assets', safeFilename);

  try {
    if (fs.existsSync(imagePath)) {
      const imgBuffer = fs.readFileSync(imagePath);
      const ext = path.extname(imagePath).slice(1); // jpg, png, etc.
      return `data:image/${ext};base64,${imgBuffer.toString('base64')}`;
    } else {
      console.warn(`⚠️ Image not found: ${imagePath}`);
      return null;
    }
  } catch (err) {
    console.error(`Error reading image: ${err}`);
    return null;
  }
};

// 📌 Add to wishlist
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

// 📌 Get wishlist by user ID with Base64 images
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

    // Convert every image to Base64 before sending
    const updatedResults = results.map(item => ({
      ...item,
      image: fileToBase64(item.image)
    }));

    res.json(updatedResults);
  });
};

// 📌 Remove from wishlist
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
