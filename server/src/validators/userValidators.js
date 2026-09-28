const { body } = require('express-validator');
const { validate } = require('./authValidators');

const createUserValidator = validate([
  body('name')
    .trim()
    .notEmpty()
    .withMessage('User full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Initial password must be at least 6 characters long'),
  body('role')
    .notEmpty()
    .withMessage('Role selection is required'),
  body('department')
    .optional()
    .trim(),
  body('phone')
    .optional()
    .trim(),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status must be active, inactive, or suspended')
]);

const updateUserValidator = validate([
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),
  body('role')
    .optional()
    .notEmpty()
    .withMessage('Role ID cannot be empty'),
  body('department')
    .optional()
    .trim(),
  body('phone')
    .optional()
    .trim(),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status must be active, inactive, or suspended'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
]);

module.exports = {
  createUserValidator,
  updateUserValidator
};
