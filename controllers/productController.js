const fs = require('fs');
const path = require('path');
const db = require('../config/db');

// ✅ Helper function to convert an image file to Base64
const getBase64Image = (filename) => {
  if (!filename) return null;

  try {
    // ✅ Correct path (points to backend-ecom/public/assets)
    const imagePath = path.join(__dirname, '../../public/assets', filename);

    // ✅ Check if the file exists
    if (!fs.existsSync(imagePath)) {
      console.warn(`⚠️ Image not found: ${imagePath}`);
      return null;
    }

    // ✅ Read image and convert to Base64
    const imageData = fs.readFileSync(imagePath);
    const mimeType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${imageData.toString('base64')}`;

  } catch (error) {
    console.error(`❌ Error converting image: ${filename}`, error);
    return null;
  }
};

// ✅ Get ALL products and convert image to Base64
exports.getAllProducts = (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const products = results.map(product => {
      product.image_url = getBase64Image(product.image_url); // ✅ Convert file to Base64
      return product;
    });

    res.json(products);
  });
};

// ✅ Get SINGLE product by ID and convert image to Base64
exports.getProductById = (req, res) => {
  const id = req.params.id;

  db.query('SELECT * FROM products WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = results[0];
    product.image_url = getBase64Image(product.image_url); // ✅ Convert file to Base64

    res.json(product);
  });
};
