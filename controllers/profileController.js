const fs = require('fs');
const path = require('path');
const db = require('../config/db');

// ✅ Get profile by user ID (with Base64 image conversion)
const getProfileByUserId = (req, res) => {
  const { userId } = req.params;
  const query = 'SELECT * FROM profile WHERE user_id = ? LIMIT 1';

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching profile:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    let profile = results[0];

    // ✅ Convert profile image to Base64 if it exists
    if (profile.profile_image) {
      try {
        // remove any leading slash from DB path
        const safeImagePath = profile.profile_image.replace(/^\/+/, '');

        // resolve full path to image in backend
        const imagePath = path.resolve(__dirname, '..', safeImagePath);

        if (fs.existsSync(imagePath)) {
          const imgData = fs.readFileSync(imagePath);
          const ext = path.extname(imagePath).slice(1); // jpg/png
          profile.profile_image = `data:image/${ext};base64,${imgData.toString('base64')}`;
        } else {
          console.warn(`⚠️ Profile image not found: ${imagePath}`);
          profile.profile_image = null;
        }
      } catch (error) {
        console.error('Error converting profile image to Base64:', error);
        profile.profile_image = null;
      }
    }

    res.json(profile);
  });
};


// ✅ Update profile (store clean path)
const updateProfile = (req, res) => {
  const { userId } = req.params;
  const { username, dob, phone_no, address, bio } = req.body;

  // ✅ Save without leading slash
  const profile_image = req.file ? `uploads/${req.file.filename}` : null;

  // First: check if profile exists
  const checkQuery = 'SELECT * FROM profile WHERE user_id = ?';
  db.query(checkQuery, [userId], (err, results) => {
    if (err) {
      console.error('Error checking profile:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      // ✅ Insert new profile
      const insertQuery = `
        INSERT INTO profile (user_id, username, dob, phone_no, address, bio, profile_image)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(
        insertQuery,
        [userId, username, dob, phone_no, address, bio, profile_image],
        (insertErr) => {
          if (insertErr) {
            console.error('Error inserting profile:', insertErr);
            return res.status(500).json({ error: 'Failed to insert profile' });
          }
          return res.json({ message: 'Profile created successfully' });
        }
      );
    } else {
      // ✅ Update existing profile
      const updateQuery = `
        UPDATE profile
        SET username = ?, dob = ?, phone_no = ?, address = ?, bio = ?, 
            profile_image = COALESCE(?, profile_image)
        WHERE user_id = ?
      `;
      db.query(
        updateQuery,
        [username, dob, phone_no, address, bio, profile_image, userId],
        (updateErr) => {
          if (updateErr) {
            console.error('Error updating profile:', updateErr);
            return res.status(500).json({ error: 'Failed to update profile' });
          }
          return res.json({ message: 'Profile updated successfully' });
        }
      );
    }
  });
};

module.exports = {
  getProfileByUserId,
  updateProfile,
};
