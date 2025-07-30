const express = require('express');
const router = express.Router();
const ClassSchedule = require('../models/ClassSchedule');
const { classScheduleSchemas, validate } = require('../middleware/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get all class schedules
// @route   GET /api/schedules
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    date,
    instructor,
    department,
    status,
    sortBy = 'date',
    sortOrder = 'asc'
  } = req.query;

  // Build query
  const query = {};
  
  if (date) {
    const searchDate = new Date(date);
    query.date = {
      $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
      $lt: new Date(searchDate.setHours(23, 59, 59, 999))
    };
  }
  
  if (instructor) {
    query.instructor = { $regex: instructor, $options: 'i' };
  }
  
  if (department) {
    query.department = { $regex: department, $options: 'i' };
  }
  
  if (status) {
    query.status = status;
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  if (sortBy !== 'startTime') {
    sort.startTime = 1; // Secondary sort by start time
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;
  const schedules = await ClassSchedule.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await ClassSchedule.countDocuments(query);

  res.json({
    success: true,
    count: schedules.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: schedules
  });
}));

// @desc    Get single class schedule
// @route   GET /api/schedules/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const schedule = await ClassSchedule.findById(req.params.id);

  if (!schedule) {
    throw new AppError('Schedule not found', 404);
  }

  res.json({
    success: true,
    data: schedule
  });
}));

// @desc    Create new class schedule
// @route   POST /api/schedules
// @access  Private (for now public)
router.post('/', validate(classScheduleSchemas.create), asyncHandler(async (req, res) => {
  // Check for scheduling conflicts
  const conflictCheck = await ClassSchedule.findOne({
    room: req.body.room,
    date: req.body.date,
    $or: [
      {
        startTime: { $lt: req.body.endTime },
        endTime: { $gt: req.body.startTime }
      }
    ]
  });

  if (conflictCheck) {
    throw new AppError('Room is already booked for this time slot', 409);
  }

  const schedule = await ClassSchedule.create(req.body);

  res.status(201).json({
    success: true,
    data: schedule
  });
}));

// @desc    Update class schedule
// @route   PUT /api/schedules/:id
// @access  Private (for now public)
router.put('/:id', validate(classScheduleSchemas.update), asyncHandler(async (req, res) => {
  let schedule = await ClassSchedule.findById(req.params.id);

  if (!schedule) {
    throw new AppError('Schedule not found', 404);
  }

  // Check for scheduling conflicts if room, date, or time is being updated
  if (req.body.room || req.body.date || req.body.startTime || req.body.endTime) {
    const conflictCheck = await ClassSchedule.findOne({
      _id: { $ne: req.params.id },
      room: req.body.room || schedule.room,
      date: req.body.date || schedule.date,
      $or: [
        {
          startTime: { $lt: req.body.endTime || schedule.endTime },
          endTime: { $gt: req.body.startTime || schedule.startTime }
        }
      ]
    });

    if (conflictCheck) {
      throw new AppError('Room is already booked for this time slot', 409);
    }
  }

  schedule = await ClassSchedule.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.json({
    success: true,
    data: schedule
  });
}));

// @desc    Delete class schedule
// @route   DELETE /api/schedules/:id
// @access  Private (for now public)
router.delete('/:id', asyncHandler(async (req, res) => {
  const schedule = await ClassSchedule.findById(req.params.id);

  if (!schedule) {
    throw new AppError('Schedule not found', 404);
  }

  await ClassSchedule.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Schedule deleted successfully'
  });
}));

// @desc    Get today's schedules
// @route   GET /api/schedules/today
// @access  Public
router.get('/filter/today', asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const schedules = await ClassSchedule.find({
    date: {
      $gte: startOfDay,
      $lt: endOfDay
    }
  }).sort({ startTime: 1 });

  res.json({
    success: true,
    count: schedules.length,
    data: schedules
  });
}));

// @desc    Get schedules by date range
// @route   GET /api/schedules/range/:startDate/:endDate
// @access  Public
router.get('/range/:startDate/:endDate', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.params;
  
  const schedules = await ClassSchedule.find({
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ date: 1, startTime: 1 });

  res.json({
    success: true,
    count: schedules.length,
    data: schedules
  });
}));

// @desc    Get schedules by instructor
// @route   GET /api/schedules/instructor/:instructorName
// @access  Public
router.get('/instructor/:instructorName', asyncHandler(async (req, res) => {
  const schedules = await ClassSchedule.find({
    instructor: { $regex: req.params.instructorName, $options: 'i' }
  }).sort({ date: 1, startTime: 1 });

  res.json({
    success: true,
    count: schedules.length,
    data: schedules
  });
}));

module.exports = router;
