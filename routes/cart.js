const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  removeFromCart,
} = require('../controllers/cartController');

router.get('/:userId', getCart);
router.post('/add', addToCart);
router.post('/remove', removeFromCart);

module.exports = router;
