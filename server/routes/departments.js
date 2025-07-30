const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const ClassSchedule = require('../models/ClassSchedule');
const Instructor = require('../models/Instructor');
const { departmentSchemas, validate } = require('../middleware/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status = 'active',
    search,
    sortBy = 'name',
    sortOrder = 'asc'
  } = req.query;

  // Build query
  const query = {};
  
  if (status) {
    query.status = status;
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const skip = (page - 1) * limit;
  const departments = await Department.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Department.countDocuments(query);

  res.json({
    success: true,
    count: departments.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: departments
  });
}));

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    throw new AppError('Department not found', 404);
  }

  res.json({
    success: true,
    data: department
  });
}));

// @desc    Create new department
// @route   POST /api/departments
// @access  Private (for now public)
router.post('/', validate(departmentSchemas.create), asyncHandler(async (req, res) => {
  const department = await Department.create(req.body);

  res.status(201).json({
    success: true,
    data: department
  });
}));

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (for now public)
router.put('/:id', validate(departmentSchemas.update), asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (!department) {
    throw new AppError('Department not found', 404);
  }

  res.json({
    success: true,
    data: department
  });
}));

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (for now public)
router.delete('/:id', asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    throw new AppError('Department not found', 404);
  }

  // Check if department has any instructors
  const instructorCount = await Instructor.countDocuments({
    department: department.name
  });

  if (instructorCount > 0) {
    throw new AppError(
      'Cannot delete department with active instructors. Please reassign or remove instructors first.',
      400
    );
  }

  // Check if department has any scheduled classes
  const classCount = await ClassSchedule.countDocuments({
    department: department.name,
    date: { $gte: new Date() }
  });

  if (classCount > 0) {
    throw new AppError(
      'Cannot delete department with scheduled classes. Please reassign or remove classes first.',
      400
    );
  }

  await Department.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Department deleted successfully'
  });
}));

// @desc    Get department statistics
// @route   GET /api/departments/:id/stats
// @access  Public
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    throw new AppError('Department not found', 404);
  }

  // Get instructor count
  const instructorCount = await Instructor.countDocuments({
    department: department.name,
    status: 'active'
  });

  // Get current week's class count
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));

  const weeklyClassCount = await ClassSchedule.countDocuments({
    department: department.name,
    date: {
      $gte: startOfWeek,
      $lte: endOfWeek
    }
  });

  // Get total enrolled students this week
  const classesWithEnrollment = await ClassSchedule.find({
    department: department.name,
    date: {
      $gte: startOfWeek,
      $lte: endOfWeek
    }
  }, 'enrolledStudents');

  const totalEnrolledStudents = classesWithEnrollment.reduce(
    (sum, cls) => sum + cls.enrolledStudents,
    0
  );

  res.json({
    success: true,
    department: department.name,
    stats: {
      instructorCount,
      weeklyClassCount,
      totalEnrolledStudents,
      averageEnrollmentPerClass: weeklyClassCount > 0 ? 
        Math.round(totalEnrolledStudents / weeklyClassCount) : 0
    }
  });
}));

// @desc    Get department's instructors
// @route   GET /api/departments/:id/instructors
// @access  Public
router.get('/:id/instructors', asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    throw new AppError('Department not found', 404);
  }

  const instructors = await Instructor.find({
    department: department.name,
    status: 'active'
  }).sort({ name: 1 });

  res.json({
    success: true,
    department: department.name,
    count: instructors.length,
    data: instructors
  });
}));

// @desc    Get department's schedule
// @route   GET /api/departments/:id/schedule
// @access  Public
router.get('/:id/schedule', asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    throw new AppError('Department not found', 404);
  }

  const { startDate, endDate } = req.query;
  const query = { department: department.name };

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
    department: department.name,
    count: schedule.length,
    data: schedule
  });
}));

module.exports = router;
