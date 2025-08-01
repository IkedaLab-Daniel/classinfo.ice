const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

// Route imports
const scheduleRoutes = require('./routes/schedules');
const announcementRoutes = require('./routes/announcements');

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 5 * 60 * 1000, // 5 minutes
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
      'http://localhost:5174',
      'https://dailyclass.netlify.app'
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

// Request logging middleware with status codes and colors
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override res.end to capture when response is sent
  res.end = function(chunk, encoding) {
    // Restore original end function
    res.end = originalEnd;
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Color codes for different status ranges
    const getStatusColor = (status) => {
      if (status >= 200 && status < 300) return '\x1b[32m'; // Green for 2xx
      if (status >= 300 && status < 400) return '\x1b[36m'; // Cyan for 3xx
      if (status >= 400 && status < 500) return '\x1b[33m'; // Yellow for 4xx
      if (status >= 500) return '\x1b[31m'; // Red for 5xx
      return '\x1b[37m'; // White for others
    };
    
    // Color codes for HTTP methods
    const getMethodColor = (method) => {
      switch (method) {
        case 'GET': return '\x1b[32m';    // Green
        case 'POST': return '\x1b[34m';   // Blue
        case 'PUT': return '\x1b[35m';    // Magenta
        case 'DELETE': return '\x1b[31m'; // Red
        case 'PATCH': return '\x1b[33m';  // Yellow
        default: return '\x1b[37m';       // White
      }
    };
    
    const resetColor = '\x1b[0m';
    const grayColor = '\x1b[90m';
    
    const statusColor = getStatusColor(res.statusCode);
    const methodColor = getMethodColor(req.method);
    
    console.log(
      `${methodColor}${req.method}${resetColor} ` +
      `${req.originalUrl} ` +
      `${statusColor}${res.statusCode}${resetColor} ` +
      `${grayColor}${responseTime}ms${resetColor} ` +
      `${grayColor}- ${new Date().toISOString()}${resetColor}`
    );
    
    // Call original end function
    return originalEnd.call(this, chunk, encoding);
  };
  
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
// Routes
app.use('/api/schedules', scheduleRoutes);
app.use('/api/announcements', announcementRoutes);

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
      announcements: {
        'GET /api/announcements': 'Get all announcements with optional filtering and pagination',
        'GET /api/announcements/:id': 'Get specific announcement by ID',
        'POST /api/announcements': 'Create new announcement',
        'PUT /api/announcements/:id': 'Update announcement',
        'DELETE /api/announcements/:id': 'Delete announcement',
        'GET /api/announcements/latest': 'Get latest announcements (default 5)',
        'GET /api/announcements/range/:startDate/:endDate': 'Get announcements in date range'
      }
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