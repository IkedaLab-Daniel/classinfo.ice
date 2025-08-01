const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { announcementSchemas, validate } = require('../middleware/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search
  } = req.query;

  // Build query
  const query = {};
  
  // Add text search if provided
  if (search) {
    query.$text = { $search: search };
  }

  // Convert page and limit to numbers
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(50, parseInt(limit))); // Max 50 items per page
  const skip = (pageNum - 1) * limitNum;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute query with pagination
  const [announcements, total] = await Promise.all([
    Announcement.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Announcement.countDocuments(query)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(total / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  res.status(200).json({
    success: true,
    count: announcements.length,
    total,
    pagination: {
      page: pageNum,
      limit: limitNum,
      pages: totalPages,
      hasNext: hasNextPage,
      hasPrev: hasPrevPage
    },
    data: announcements
  });
}));

// @desc    Get latest announcements (most recent 5)
// @route   GET /api/announcements/latest
// @access  Public
router.get('/latest', asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;
  const limitNum = Math.max(1, Math.min(10, parseInt(limit))); // Max 10 items

  const announcements = await Announcement.find()
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .lean();

  res.status(200).json({
    success: true,
    count: announcements.length,
    data: announcements
  });
}));

// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    throw new AppError('Announcement not found', 404);
  }

  res.status(200).json({
    success: true,
    data: announcement
  });
}));

// @desc    Create new announcement
// @route   POST /api/announcements
// @access  Private (you can add authentication middleware later)
router.post('/', validate(announcementSchemas.create), asyncHandler(async (req, res) => {
  const { title, description, postedBy } = req.body;

  const announcement = await Announcement.create({
    title,
    description,
    postedBy
  });

  res.status(201).json({
    success: true,
    message: 'Announcement created successfully',
    data: announcement
  });
}));

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private (you can add authentication middleware later)
router.put('/:id', validate(announcementSchemas.update), asyncHandler(async (req, res) => {
  const { title, description, postedBy } = req.body;

  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    throw new AppError('Announcement not found', 404);
  }

  // Update fields
  if (title !== undefined) announcement.title = title;
  if (description !== undefined) announcement.description = description;
  if (postedBy !== undefined) announcement.postedBy = postedBy;

  await announcement.save();

  res.status(200).json({
    success: true,
    message: 'Announcement updated successfully',
    data: announcement
  });
}));

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (you can add authentication middleware later)
router.delete('/:id', asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    throw new AppError('Announcement not found', 404);
  }

  await announcement.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Announcement deleted successfully'
  });
}));

// @desc    Get announcements by date range
// @route   GET /api/announcements/range/:startDate/:endDate
// @access  Public
router.get('/range/:startDate/:endDate', asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new AppError('Invalid date format. Use YYYY-MM-DD', 400);
  }

  if (start > end) {
    throw new AppError('Start date must be before end date', 400);
  }

  // Set time to cover full days
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  // Convert page and limit to numbers
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(50, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  // Build query
  const query = {
    createdAt: {
      $gte: start,
      $lte: end
    }
  };

  // Execute query with pagination
  const [announcements, total] = await Promise.all([
    Announcement.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Announcement.countDocuments(query)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(total / limitNum);

  res.status(200).json({
    success: true,
    count: announcements.length,
    total,
    pagination: {
      page: pageNum,
      limit: limitNum,
      pages: totalPages
    },
    data: announcements
  });
}));

module.exports = router;
