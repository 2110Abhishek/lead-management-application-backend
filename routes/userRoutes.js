const express = require('express');
const router = express.Router();
const { registerUser, getUsers } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').post(protect, admin, registerUser).get(protect, admin, getUsers);

module.exports = router;
