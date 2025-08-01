const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  postedBy: {
    type: String,
    required: [true, 'Posted by is required'],
    trim: true,
    maxlength: [100, 'Posted by cannot exceed 100 characters']
  }
}, {
  timestamps: true, // This automatically adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
announcementSchema.index({ createdAt: -1 }); // Most recent first
announcementSchema.index({ title: 'text', description: 'text' }); // Text search

// Virtual for formatted creation date
announcementSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Pre-save middleware
announcementSchema.pre('save', function(next) {
  // Ensure title is properly capitalized
  if (this.title) {
    this.title = this.title.charAt(0).toUpperCase() + this.title.slice(1);
  }
  next();
});

module.exports = mongoose.model('Announcement', announcementSchema);
