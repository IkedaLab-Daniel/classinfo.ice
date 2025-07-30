const Joi = require('joi');

// Class Schedule Validation Schemas
const classScheduleSchemas = {
  create: Joi.object({
    subject: Joi.string().trim().max(100).required(),
    date: Joi.date().required(), // Removed .min('now') to allow past/present dates
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    room: Joi.string().trim().max(50).required(),
    description: Joi.string().trim().max(500).allow('').default(''),
    status: Joi.string().valid('active', 'cancelled', 'completed').default('active')
  }),
  
  update: Joi.object({
    subject: Joi.string().trim().max(100),
    date: Joi.date(), // Removed .min('now') to allow past/present dates
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    room: Joi.string().trim().max(50),
    description: Joi.string().trim().max(500).allow(''),
    status: Joi.string().valid('active', 'cancelled', 'completed')
  }).min(1)
};

// Validation middleware function
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    req.body = value;
    next();
  };
};

module.exports = {
  classScheduleSchemas,
  validate
};
