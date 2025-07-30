const Joi = require('joi');

// Class Schedule Validation Schemas
const classScheduleSchemas = {
  create: Joi.object({
    subject: Joi.string().trim().max(100).required(),
    instructor: Joi.string().trim().max(100).required(),
    date: Joi.date().required(), // Removed .min('now') to allow past/present dates
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    room: Joi.string().trim().max(50).required(),
    description: Joi.string().trim().max(500).allow('').default(''),
    credits: Joi.number().integer().min(1).max(6).default(3),
    department: Joi.string().trim().max(100).required(),
    capacity: Joi.number().integer().min(1).max(500).default(30),
    enrolledStudents: Joi.number().integer().min(0).default(0),
    status: Joi.string().valid('active', 'cancelled', 'completed').default('active')
  }),
  
  update: Joi.object({
    subject: Joi.string().trim().max(100),
    instructor: Joi.string().trim().max(100),
    date: Joi.date(), // Removed .min('now') to allow past/present dates
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    room: Joi.string().trim().max(50),
    description: Joi.string().trim().max(500).allow(''),
    credits: Joi.number().integer().min(1).max(6),
    department: Joi.string().trim().max(100),
    capacity: Joi.number().integer().min(1).max(500),
    enrolledStudents: Joi.number().integer().min(0),
    status: Joi.string().valid('active', 'cancelled', 'completed')
  }).min(1)
};

// Instructor Validation Schemas
const instructorSchemas = {
  create: Joi.object({
    name: Joi.string().trim().max(100).required(),
    email: Joi.string().email().lowercase().required(),
    department: Joi.string().trim().max(100).required(),
    office: Joi.string().trim().max(50).required(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).allow(''),
    specialization: Joi.array().items(Joi.string().trim()),
    officeHours: Joi.string().max(200).allow(''),
    bio: Joi.string().max(1000).allow(''),
    status: Joi.string().valid('active', 'inactive', 'on-leave').default('active')
  }),
  
  update: Joi.object({
    name: Joi.string().trim().max(100),
    email: Joi.string().email().lowercase(),
    department: Joi.string().trim().max(100),
    office: Joi.string().trim().max(50),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).allow(''),
    specialization: Joi.array().items(Joi.string().trim()),
    officeHours: Joi.string().max(200).allow(''),
    bio: Joi.string().max(1000).allow(''),
    status: Joi.string().valid('active', 'inactive', 'on-leave')
  }).min(1)
};

// Department Validation Schemas
const departmentSchemas = {
  create: Joi.object({
    name: Joi.string().trim().max(100).required(),
    code: Joi.string().trim().uppercase().max(10).required(),
    description: Joi.string().max(500).allow(''),
    head: Joi.string().max(100).allow(''),
    location: Joi.string().max(100).allow(''),
    contact: Joi.object({
      email: Joi.string().email().allow(''),
      phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).allow('')
    }),
    status: Joi.string().valid('active', 'inactive').default('active')
  }),
  
  update: Joi.object({
    name: Joi.string().trim().max(100),
    code: Joi.string().trim().uppercase().max(10),
    description: Joi.string().max(500).allow(''),
    head: Joi.string().max(100).allow(''),
    location: Joi.string().max(100).allow(''),
    contact: Joi.object({
      email: Joi.string().email().allow(''),
      phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).allow('')
    }),
    status: Joi.string().valid('active', 'inactive')
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
  instructorSchemas,
  departmentSchemas,
  validate
};
