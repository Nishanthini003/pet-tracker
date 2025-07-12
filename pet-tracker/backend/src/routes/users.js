const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Petition = require('../models/Petition');
const auth = require('../middleware/auth');

// Get all users with their petitions (admin only)
router.get('/', async (req, res) => {
  res.send('working')
});

module.exports = router;
