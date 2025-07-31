const db = require('../config/db');

const submitContactForm = (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const query = `
    INSERT INTO contact_messages (name, email, message)
    VALUES (?, ?, ?)
  `;

  db.query(query, [name, email, message], (err, result) => {
    if (err) {
      console.error('Error saving contact message:', err);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    res.status(200).json({ message: 'Message submitted successfully' });
  });
};

module.exports = { submitContactForm };
