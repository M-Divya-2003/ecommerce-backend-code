const fs = require('fs');
const path = require('path');
const db = require('../config/db');

// ✅ Helper: Convert file to Base64
// ✅ Helper: Convert file to Base64
const getBase64Image = (imageUrl) => {
  try {
    // Ensure filename is safe
    const safeFilename = path.basename(imageUrl);

    // Absolute path to public/assets
    const imagePath = path.join(__dirname, '..', 'assets', safeFilename);

    if (!fs.existsSync(imagePath)) {
      console.warn(`⚠️ Image not found: ${imagePath}`);
      return null;
    }

    // Read file and determine MIME type
    const imageData = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath).toLowerCase().replace('.', '');
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    // Return Base64 data URI
    return `data:${mimeType};base64,${imageData.toString('base64')}`;
  } catch (error) {
    console.error(`❌ Error converting image: ${imageUrl}`, error);
    return null;
  }
};

// ✅ Get ALL products (Base64 images)
exports.getAllProducts = (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const products = results.map(product => {
      product.image_url = getBase64Image(product.image_url);
      return product;
    });

    res.json(products);
  });
};

// ✅ Get SINGLE product (Base64 image)
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
    product.image_url = getBase64Image(product.image_url);

    res.json(product);
  });
};
