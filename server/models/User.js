const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  studentId: {
    type: String,
    trim: true,
    maxlength: [50, 'Student ID cannot exceed 50 characters']
  },
  className: {
    type: String,
    default: 'BSIT - 3B',
    trim: true
  },
  // Push notification subscription data
  pushSubscription: {
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String
    }
  },
  // Notification preferences
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    announcements: {
      type: Boolean,
      default: true
    },
    scheduleUpdates: {
      type: Boolean,
      default: true
    },
    taskReminders: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ isActive: 1 });

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Ensure name is properly capitalized
  if (this.name) {
    this.name = this.name.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
