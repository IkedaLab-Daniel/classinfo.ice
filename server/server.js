const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

// Route imports
const scheduleRoutes = require('./routes/schedules');

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5174'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ClassInfo API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/schedules', scheduleRoutes);

// API documentation route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'ClassInfo API v1.0.0',
    endpoints: {
      schedules: {
        'GET /api/schedules': 'Get all class schedules with optional filtering',
        'GET /api/schedules/:id': 'Get specific schedule by ID',
        'POST /api/schedules': 'Create new schedule',
        'PUT /api/schedules/:id': 'Update schedule',
        'DELETE /api/schedules/:id': 'Delete schedule',
        'GET /api/schedules/filter/today': 'Get today\'s schedules',
        'GET /api/schedules/range/:startDate/:endDate': 'Get schedules in date range',
        'GET /api/schedules/instructor/:instructorName': 'Get schedules by instructor'
      },
    },
    queryParameters: {
      pagination: 'page, limit',
      sorting: 'sortBy, sortOrder (asc/desc)',
      filtering: 'Various filters based on endpoint',
      search: 'search (text search where applicable)'
    }
  });
});

// Catch all route for undefined endpoints
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`📚 ClassInfo API available at http://localhost:${PORT}`);
  console.log(`📖 API documentation at http://localhost:${PORT}/api`);
  console.log(`💚 Health check at http://localhost:${PORT}/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;