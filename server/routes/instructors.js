const express = require('express');
const router = express.Router();
const Instructor = require('../models/Instructor');
const ClassSchedule = require('../models/ClassSchedule');
const { instructorSchemas, validate } = require('../middleware/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get all instructors
// @route   GET /api/instructors
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    department,
    status = 'active',
    search,
    sortBy = 'name',
    sortOrder = 'asc'
  } = req.query;

  // Build query
  const query = {};
  
  if (department) {
    query.department = { $regex: department, $options: 'i' };
  }
  
  if (status) {
    query.status = status;
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const skip = (page - 1) * limit;
  const instructors = await Instructor.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Instructor.countDocuments(query);

  res.json({
    success: true,
    count: instructors.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: instructors
  });
}));

// @desc    Get single instructor
// @route   GET /api/instructors/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const instructor = await Instructor.findById(req.params.id);

  if (!instructor) {
    throw new AppError('Instructor not found', 404);
  }

  res.json({
    success: true,
    data: instructor
  });
}));

// @desc    Create new instructor
// @route   POST /api/instructors
// @access  Private (for now public)
router.post('/', validate(instructorSchemas.create), asyncHandler(async (req, res) => {
  const instructor = await Instructor.create(req.body);

  res.status(201).json({
    success: true,
    data: instructor
  });
}));

// @desc    Update instructor
// @route   PUT /api/instructors/:id
// @access  Private (for now public)
router.put('/:id', validate(instructorSchemas.update), asyncHandler(async (req, res) => {
  const instructor = await Instructor.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (!instructor) {
    throw new AppError('Instructor not found', 404);
  }

  res.json({
    success: true,
    data: instructor
  });
}));

// @desc    Delete instructor
// @route   DELETE /api/instructors/:id
// @access  Private (for now public)
router.delete('/:id', asyncHandler(async (req, res) => {
  const instructor = await Instructor.findById(req.params.id);

  if (!instructor) {
    throw new AppError('Instructor not found', 404);
  }

  // Check if instructor has any scheduled classes
  const scheduledClasses = await ClassSchedule.countDocuments({
    instructor: instructor.name,
    date: { $gte: new Date() }
  });

  if (scheduledClasses > 0) {
    throw new AppError(
      'Cannot delete instructor with scheduled classes. Please reassign or remove the classes first.',
      400
    );
  }

  await Instructor.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Instructor deleted successfully'
  });
}));

// @desc    Get instructor's schedule
// @route   GET /api/instructors/:id/schedule
// @access  Public
router.get('/:id/schedule', asyncHandler(async (req, res) => {
  const instructor = await Instructor.findById(req.params.id);

  if (!instructor) {
    throw new AppError('Instructor not found', 404);
  }

  const { startDate, endDate } = req.query;
  const query = { instructor: instructor.name };

  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  } else {
    // Default to current week
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    
    query.date = {
      $gte: startOfWeek,
      $lte: endOfWeek
    };
  }

  const schedule = await ClassSchedule.find(query).sort({ date: 1, startTime: 1 });

  res.json({
    success: true,
    instructor: instructor.name,
    count: schedule.length,
    data: schedule
  });
}));

// @desc    Get instructors by department
// @route   GET /api/instructors/department/:departmentName
// @access  Public
router.get('/department/:departmentName', asyncHandler(async (req, res) => {
  const instructors = await Instructor.find({
    department: { $regex: req.params.departmentName, $options: 'i' },
    status: 'active'
  }).sort({ name: 1 });

  res.json({
    success: true,
    department: req.params.departmentName,
    count: instructors.length,
    data: instructors
  });
}));

module.exports = router;
