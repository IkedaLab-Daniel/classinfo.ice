const express = require('express');
const router = express.Router();
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const { userSchemas, validate } = require('../middleware/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Subscribe user for notifications
// @route   POST /api/users/subscribe
// @access  Public
router.post('/subscribe', validate(userSchemas.subscribe), asyncHandler(async (req, res) => {
  const { email, name, studentId, pushSubscription, preferences } = req.body;

  // Check if user already exists
  let user = await User.findOne({ email });

  if (user) {
    // Update existing user
    if (name) user.name = name;
    if (studentId) user.studentId = studentId;
    if (pushSubscription) user.pushSubscription = pushSubscription;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    user.isActive = true;

    await user.save();
  } else {
    // Create new user
    user = await User.create({
      email,
      name,
      studentId,
      pushSubscription,
      preferences: preferences || {}
    });
  }

  res.status(200).json({
    success: true,
    message: 'Successfully subscribed to notifications',
    data: {
      id: user._id,
      email: user.email,
      name: user.name,
      preferences: user.preferences
    }
  });
}));

// @desc    Update push subscription
// @route   PUT /api/users/push-subscription
// @access  Public
router.put('/push-subscription', asyncHandler(async (req, res) => {
  const { email, pushSubscription } = req.body;

  if (!email || !pushSubscription) {
    throw new AppError('Email and push subscription are required', 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.pushSubscription = pushSubscription;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Push subscription updated successfully'
  });
}));

// @desc    Update notification preferences
// @route   PUT /api/users/preferences
// @access  Public
router.put('/preferences', asyncHandler(async (req, res) => {
  const { email, preferences } = req.body;

  if (!email || !preferences) {
    throw new AppError('Email and preferences are required', 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.preferences = { ...user.preferences, ...preferences };
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Preferences updated successfully',
    data: user.preferences
  });
}));

// @desc    Unsubscribe user
// @route   DELETE /api/users/unsubscribe/:email
// @access  Public
router.delete('/unsubscribe/:email', asyncHandler(async (req, res) => {
  const { email } = req.params;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.isActive = false;
  user.pushSubscription = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Successfully unsubscribed from notifications'
  });
}));

// @desc    Get user subscription status
// @route   GET /api/users/subscription/:email
// @access  Public
router.get('/subscription/:email', asyncHandler(async (req, res) => {
  const { email } = req.params;

  const user = await User.findOne({ email });
  
  if (!user) {
    return res.status(200).json({
      success: true,
      data: {
        subscribed: false,
        preferences: {}
      }
    });
  }

  res.status(200).json({
    success: true,
    data: {
      subscribed: user.isActive,
      name: user.name,
      studentId: user.studentId,
      preferences: user.preferences,
      hasPushSubscription: !!user.pushSubscription
    }
  });
}));

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, active } = req.query;

  const query = {};
  if (active !== undefined) {
    query.isActive = active === 'true';
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(50, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-pushSubscription') // Don't expose subscription details
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limitNum);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    pagination: {
      page: pageNum,
      limit: limitNum,
      pages: totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    },
    data: users
  });
}));

// @desc    Send test notification to a user
// @route   POST /api/users/test-notification
// @access  Private (admin only)
router.post('/test-notification', asyncHandler(async (req, res) => {
  const { email, type = 'email' } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const testNotification = {
    title: 'Test Notification',
    description: 'This is a test notification to verify that the system is working correctly.',
    postedBy: 'System Administrator',
    createdAt: new Date()
  };

  let result;

  if (type === 'email') {
    result = await notificationService.sendEmailNotification(user, testNotification);
  } else if (type === 'push') {
    if (!user.pushSubscription) {
      throw new AppError('User does not have a push subscription', 400);
    }
    result = await notificationService.sendPushNotificationToUser(user, testNotification);
  } else {
    throw new AppError('Invalid notification type. Use "email" or "push"', 400);
  }

  res.status(200).json({
    success: result.success,
    message: result.success ? 'Test notification sent successfully' : 'Failed to send test notification',
    error: result.error
  });
}));

// @desc    Get VAPID public key for push notifications
// @route   GET /api/users/vapid-public-key
// @access  Public
router.get('/vapid-public-key', (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  
  if (!publicKey) {
    return res.status(500).json({
      success: false,
      message: 'VAPID public key not configured'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      publicKey
    }
  });
});

module.exports = router;
