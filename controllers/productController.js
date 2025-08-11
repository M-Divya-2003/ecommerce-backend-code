const fs = require('fs');
const path = require('path');
const pool = require('../db'); // MySQL connection pool

// ✅ Helper: Convert image file to Base64
const getBase64Image = (imageUrl) => {
  if (!imageUrl) return null;

  try {
    const fileName = path.basename(imageUrl);
    const imageFullPath = path.join(__dirname, '..', 'assets', fileName);

    if (!fs.existsSync(imageFullPath)) {
      console.warn(`⚠️ Image not found: ${imageFullPath}`);
      return null;
    }

    const imageBuffer = fs.readFileSync(imageFullPath);
    const ext = path.extname(fileName).toLowerCase().replace('.', '');
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
  } catch (err) {
    console.error(`❌ Error converting image (${imageUrl}):`, err);
    return null;
  }
};

// ✅ Get ALL products with Base64 images
exports.getAllProducts = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM products');

    const updatedRows = rows.map(product => ({
      ...product,
      image_base64: getBase64Image(product.image_url)
    }));

    res.json(updatedRows);
  } catch (err) {
    console.error('❌ Database error in getAllProducts:', err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get SINGLE product with Base64 image
exports.getProductById = async (req, res) => {
  const productId = req.params.id;

  try {
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [productId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = rows[0];
    product.image_base64 = getBase64Image(product.image_url);

    res.json(product);
  } catch (err) {
    console.error(`❌ Error fetching product with ID ${productId}:`, err);
    res.status(500).json({ message: err.message });
  }
};
