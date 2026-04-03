const { validationResult } = require('express-validator');
const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map(v => v.run(req)));
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  res.status(400).json({
    success: false,
    error: errors.array().map(e => e.msg).join(', '),
    code: 'VALIDATION_ERROR',
  });
};
module.exports = validate;
