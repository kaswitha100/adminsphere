const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');
const { changePasswordValidator } = require('../validators/authValidators');

router.use(authenticate);

router.get('/', getProfile);
router.put('/', updateProfile);
router.post('/change-password', changePasswordValidator, changePassword);

module.exports = router;
