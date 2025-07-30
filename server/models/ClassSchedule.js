const mongoose = require('mongoose');

const classScheduleSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  instructor: {
    type: String,
    required: [true, 'Instructor is required'],
    trim: true,
    maxlength: [100, 'Instructor name cannot exceed 100 characters']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
  },
  room: {
    type: String,
    required: [true, 'Room is required'],
    trim: true,
    maxlength: [50, 'Room cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
    maxlength: [100, 'Department cannot exceed 100 characters']
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'completed'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if class is full
classScheduleSchema.virtual('isFull').get(function() {
  return this.enrolledStudents >= this.capacity;
});

// Virtual for available spots
classScheduleSchema.virtual('availableSpots').get(function() {
  return this.capacity - this.enrolledStudents;
});

// Index for efficient queries
classScheduleSchema.index({ date: 1, startTime: 1 });
classScheduleSchema.index({ instructor: 1, date: 1 });

// Validation to ensure end time is after start time
classScheduleSchema.pre('save', function(next) {
  const startTime = this.startTime.split(':').map(Number);
  const endTime = this.endTime.split(':').map(Number);
  
  const startMinutes = startTime[0] * 60 + startTime[1];
  const endMinutes = endTime[0] * 60 + endTime[1];
  
  if (endMinutes <= startMinutes) {
    return next(new Error('End time must be after start time'));
  }
  
  next();
});

module.exports = mongoose.model('ClassSchedule', classScheduleSchema);
