const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { validateTask } = require('../middleware/validation');

// Middleware to add calculated status to task responses
const addCalculatedStatus = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    if (data && data.data) {
      // Handle single task
      if (data.data._id || data.data.id) {
        data.data.status = data.data.calculatedStatus || data.data.status;
      }
      // Handle array of tasks
      else if (Array.isArray(data.data)) {
        data.data = data.data.map(task => ({
          ...task.toObject(),
          status: task.calculatedStatus || task.status
        }));
      }
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Apply middleware to all routes
router.use(addCalculatedStatus);

// @desc    Get all tasks with filtering and pagination
// @route   GET /api/tasks
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      class: className,
      priority,
      sortBy = 'dueDate',
      sortOrder = 'asc',
      search,
      dueBefore,
      dueAfter
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (className) filter.class = new RegExp(className, 'i');
    if (priority) filter.priority = priority;
    
    // Date filtering
    if (dueBefore || dueAfter) {
      filter.dueDate = {};
      if (dueBefore) filter.dueDate.$lte = new Date(dueBefore);
      if (dueAfter) filter.dueDate.$gte = new Date(dueAfter);
    }
    
    // Text search across title and description
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { class: new RegExp(search, 'i') }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const tasks = await Task.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Task.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      count: tasks.length,
      pagination: {
        page: parseInt(page),
        pages: totalPages,
        total,
        limit: parseInt(limit)
      },
      data: tasks
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format'
      });
    }
    next(error);
  }
});

// @desc    Create new task
// @route   POST /api/tasks
// @access  Public
router.post('/', validateTask, async (req, res, next) => {
  try {
    const task = await Task.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors
      });
    }
    next(error);
  }
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Public
router.put('/:id', validateTask, async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format'
      });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors
      });
    }
    next(error);
  }
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Public
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format'
      });
    }
    next(error);
  }
});

// @desc    Get tasks by status
// @route   GET /api/tasks/status/:status
// @access  Public
router.get('/status/:status', async (req, res, next) => {
  try {
    const { status } = req.params;
    const validStatuses = ['pending', 'in-progress', 'completed', 'overdue', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const tasks = await Task.getByStatus(status);

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get overdue tasks
// @route   GET /api/tasks/filter/overdue
// @access  Public
router.get('/filter/overdue', async (req, res, next) => {
  try {
    const tasks = await Task.getOverdue();

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get upcoming tasks (next 7 days by default)
// @route   GET /api/tasks/filter/upcoming
// @access  Public
router.get('/filter/upcoming', async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const tasks = await Task.getUpcoming(parseInt(days));

    res.json({
      success: true,
      count: tasks.length,
      data: tasks,
      message: `Tasks due in the next ${days} days`
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get tasks by class/course
// @route   GET /api/tasks/class/:className
// @access  Public
router.get('/class/:className', async (req, res, next) => {
  try {
    const { className } = req.params;
    const tasks = await Task.getByClass(className);

    res.json({
      success: true,
      count: tasks.length,
      data: tasks,
      class: className
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Public
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'in-progress', 'completed', 'cancelled'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}. Note: 'overdue' is calculated automatically.`
      });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: `Task status updated to ${status}`,
      data: task
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format'
      });
    }
    next(error);
  }
});

// @desc    Get task statistics
// @route   GET /api/tasks/stats/overview
// @access  Public
router.get('/stats/overview', async (req, res, next) => {
  try {
    const stats = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const overdueTasks = await Task.getOverdue();
    const upcomingTasks = await Task.getUpcoming();
    
    const statusCounts = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        statusBreakdown: statusCounts,
        overdue: overdueTasks.length,
        upcoming: upcomingTasks.length,
        total: Object.values(statusCounts).reduce((sum, count) => sum + count, 0)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
