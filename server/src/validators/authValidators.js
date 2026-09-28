const { body, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg
      }))
    });
  };
};

const loginValidator = validate([
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Please provide your corporate email or identifier'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
]);

const changePasswordValidator = validate([
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
]);

module.exports = {
  validate,
  loginValidator,
  changePasswordValidator
};
