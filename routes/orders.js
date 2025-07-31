const express = require('express');
const router = express.Router();
const { getOrdersByUserId } = require('../controllers/orderController');

router.get('/:userId', getOrdersByUserId);

module.exports = router;
