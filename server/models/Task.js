const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    required: [true, 'Task type is required'],
    enum: {
      values: ['assignment', 'project', 'exam', 'quiz', 'presentation', 'homework', 'lab', 'reading', 'other'],
      message: 'Type must be one of: assignment, project, exam, quiz, presentation, homework, lab, reading, other'
    }
  },
  class: {
    type: String,
    required: [true, 'Class/Course is required'],
    trim: true,
    maxlength: [100, 'Class name cannot exceed 100 characters']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    validate: {
      validator: function(value) {
        return value instanceof Date && !isNaN(value);
      },
      message: 'Please provide a valid due date'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  completedAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for days until due
taskSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed') return false;
  return new Date() > new Date(this.dueDate);
});

// Virtual for dynamic status calculation
taskSchema.virtual('calculatedStatus').get(function() {
  // If manually set to completed or cancelled, respect that
  if (this.status === 'completed' || this.status === 'cancelled') {
    return this.status;
  }
  
  // Calculate dynamic status based on due date
  if (!this.dueDate) return 'pending';
  
  const now = new Date();
  const dueDate = new Date(this.dueDate);
  
  if (now > dueDate) {
    return 'overdue';
  } else if (this.status === 'in-progress') {
    return 'in-progress';
  } else {
    return 'pending';
  }
});

// ? Index for better query performance
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ class: 1, dueDate: 1 });
taskSchema.index({ status: 1, createdAt: -1 });

// Pre-save middleware to handle completion timestamp
taskSchema.pre('save', function(next) {
  // Set completedAt when status changes to completed
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  } else if (this.status !== 'completed') {
    this.completedAt = null;
  }
  
  next();
});

// Static method to get tasks by status (now with dynamic calculation)
taskSchema.statics.getByStatus = function(status) {
  if (status === 'overdue') {
    // For overdue, find tasks past due date that aren't completed/cancelled
    return this.find({
      dueDate: { $lt: new Date() },
      status: { $nin: ['completed', 'cancelled'] }
    }).sort({ dueDate: 1, createdAt: -1 });
  } else {
    // For other statuses, use the stored status
    return this.find({ status }).sort({ dueDate: 1, createdAt: -1 });
  }
};

// Static method to get overdue tasks
taskSchema.statics.getOverdue = function() {
  return this.find({
    dueDate: { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled'] }
  }).sort({ dueDate: 1 });
};

// Static method to get upcoming tasks (next 7 days)
taskSchema.statics.getUpcoming = function(days = 7) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
  
  return this.find({
    dueDate: { 
      $gte: now,
      $lte: futureDate 
    },
    status: { $nin: ['completed', 'cancelled'] }
  }).sort({ dueDate: 1 });
};

// Static method to get tasks by class
taskSchema.statics.getByClass = function(className) {
  return this.find({ 
    class: new RegExp(className, 'i') 
  }).sort({ dueDate: 1, createdAt: -1 });
};

module.exports = mongoose.model('Task', taskSchema);
