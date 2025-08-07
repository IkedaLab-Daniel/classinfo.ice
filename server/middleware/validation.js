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

// Announcement Validation Schemas
const announcementSchemas = {
  create: Joi.object({
    title: Joi.string().trim().max(200).required(),
    description: Joi.string().trim().max(2000).required(),
    postedBy: Joi.string().trim().max(100).required()
  }),
  
  update: Joi.object({
    title: Joi.string().trim().max(200),
    description: Joi.string().trim().max(2000),
    postedBy: Joi.string().trim().max(100)
  }).min(1)
};

// Task Validation Schemas
const taskSchemas = {
  create: Joi.object({
    title: Joi.string().trim().max(200).required(),
    description: Joi.string().trim().max(1000).allow('').default(''),
    type: Joi.string().valid('assignment', 'project', 'exam', 'quiz', 'presentation', 'homework', 'lab', 'reading', 'other').required(),
    class: Joi.string().trim().max(100).required(),
    dueDate: Joi.date().required(),
    status: Joi.string().valid('pending', 'in-progress', 'completed', 'cancelled').default('pending'),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
    createdBy: Joi.string().trim().max(100).default('system')
  }),
  
  update: Joi.object({
    title: Joi.string().trim().max(200),
    description: Joi.string().trim().max(1000).allow(''),
    type: Joi.string().valid('assignment', 'project', 'exam', 'quiz', 'presentation', 'homework', 'lab', 'reading', 'other'),
    class: Joi.string().trim().max(100),
    dueDate: Joi.date(),
    status: Joi.string().valid('pending', 'in-progress', 'completed', 'cancelled'),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
    createdBy: Joi.string().trim().max(100)
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
  announcementSchemas,
  taskSchemas,
  validate,
  
  // Specific validation middleware functions
  validateSchedule: validate(classScheduleSchemas.create),
  validateScheduleUpdate: validate(classScheduleSchemas.update),
  validateAnnouncement: validate(announcementSchemas.create),
  validateAnnouncementUpdate: validate(announcementSchemas.update),
  validateTask: validate(taskSchemas.create),
  validateTaskUpdate: validate(taskSchemas.update)
};
