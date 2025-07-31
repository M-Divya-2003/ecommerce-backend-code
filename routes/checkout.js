const express = require('express');
const router = express.Router();

const {
  createRazorpayOrder,
  getAddresses,
  placeOrder,
  getLatestOrder
} = require('../controllers/checkoutController');

// Razorpay order creation
router.post('/razorpay-order', createRazorpayOrder);

// Place new order
router.post('/checkout', placeOrder);

// Get user's saved addresses
router.get('/addresses/:userId', getAddresses);

// Get latest order with items
router.get('/latest-order/:userId', getLatestOrder);

module.exports = router;
