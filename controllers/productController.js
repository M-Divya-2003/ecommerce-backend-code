const fs = require('fs');
const path = require('path');
const db = require('../config/db');

// ✅ Helper: Convert file to Base64
const getBase64Image = (filename) => {
  if (!filename) return null;

  try {
    // Clean the filename from unwanted prefixes
    let safeFilename = filename
      .replace(/^\/+/, '')         // remove leading slashes
      .replace(/^(\.\.\/)+/, '')   // remove ../
      .replace(/^assets\//, '')    // remove assets/ if exists

    // Potential locations for product images
    const possiblePaths = [
      path.join(__dirname, '../../public/assets', safeFilename) 
    ];

    // Find the first path that exists
    let imagePath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        imagePath = p;
        break;
      }
    }

    if (!imagePath) {
      console.warn(`⚠️ Image not found for: ${filename}`);
      return null;
    }

    // Read file and determine MIME type
    const imageData = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath).toLowerCase().replace('.', '');
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    return `data:${mimeType};base64,${imageData.toString('base64')}`;
  } catch (error) {
    console.error(`❌ Error converting image: ${filename}`, error);
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
