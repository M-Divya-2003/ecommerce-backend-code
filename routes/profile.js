const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getProfileByUserId, updateProfile } = require('../controllers/profileController');

// File upload configuration
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, `profile_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// Routes
router.get('/:userId', getProfileByUserId);
router.put('/:userId', upload.single('profile_image'), updateProfile);

module.exports = router;
