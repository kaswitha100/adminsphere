const express = require('express');
const router = express.Router();
const { login, getMe, logout } = require('../controllers/authController');
const { loginValidator } = require('../validators/authValidators');
const { authenticate } = require('../middleware/auth');

router.post('/login', loginValidator, login);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

module.exports = router;
