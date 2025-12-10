const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const teacherRoutes = require('./routes/teacher');
const feeRoutes = require('./routes/fee');
const adminRoutes = require('./routes/admin');
const receptionistRoutes = require('./routes/receptionist');
const paynowRoutes = require('./routes/paynow'); // PayNow routes

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'School Management System API',
      version: '1.0.0',
      description: 'API for Primary School Management System with PayNow Integration',
      contact: {
        name: 'School Admin',
        email: 'admin@school.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/receptionist', receptionistRoutes);
app.use('/api/paynow', paynowRoutes); // PayNow payment routes

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'School Management API is running!',
    version: '1.0.0',
    features: [
      'Student Management',
      'Teacher Management',
      'Fee Management',
      'Online Payments (PayNow)',
      'Admin Dashboard',
      'Receptionist Portal'
    ],
    endpoints: {
      docs: 'http://localhost:3000/api-docs',
      health: 'http://localhost:3000/health',
      auth: 'http://localhost:3000/api/auth',
      students: 'http://localhost:3000/api/students',
      teachers: 'http://localhost:3000/api/teachers',
      fees: 'http://localhost:3000/api/fees',
      paynow: 'http://localhost:3000/api/paynow',
      admin: 'http://localhost:3000/api/admin',
      receptionist: 'http://localhost:3000/api/receptionist'
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      server: 'Running',
      api: 'Available'
    },
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
  
  res.status(200).json(healthCheck);
});

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✓ MongoDB Connected');
    
    // Create indexes for better performance
    mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
    mongoose.connection.db.collection('users').createIndex({ username: 1 }, { unique: true });
    mongoose.connection.db.collection('students').createIndex({ studentId: 1 }, { unique: true });
    mongoose.connection.db.collection('teachers').createIndex({ teacherId: 1 }, { unique: true });
    
    console.log('✓ Database indexes created');
  })
  .catch(err => {
    console.error('✗ MongoDB connection error:', err.message);
    console.log('⚠️  Server will start without database connection');
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  // Handle JWT expiration
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }
  
  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', ')
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedUrl: req.originalUrl,
    availableEndpoints: {
      docs: '/api-docs',
      auth: '/api/auth',
      students: '/api/students',
      teachers: '/api/teachers',
      fees: '/api/fees',
      paynow: '/api/paynow',
      admin: '/api/admin',
      receptionist: '/api/receptionist'
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════╗
  ║                                                      ║
  ║    SCHOOL MANAGEMENT SYSTEM API                      ║
  ║    Version: 1.0.0                                    ║
  ║                                                      ║
  ╚══════════════════════════════════════════════════════╝
  
  ✓ Server running on port ${PORT}
  📚 API Documentation: http://localhost:${PORT}/api-docs
  🏥 Health check: http://localhost:${PORT}/health
  📊 Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}
  
  Available Endpoints:
  🔐 Auth:          http://localhost:${PORT}/api/auth
  👨‍🎓 Students:      http://localhost:${PORT}/api/students
  👩‍🏫 Teachers:      http://localhost:${PORT}/api/teachers
  💰 Fees:          http://localhost:${PORT}/api/fees
  💳 PayNow:        http://localhost:${PORT}/api/paynow
  👨‍💼 Admin:        http://localhost:${PORT}/api/admin
  🏢 Receptionist:  http://localhost:${PORT}/api/receptionist
  
  Environment: ${process.env.NODE_ENV || 'development'}
  PayNow Integration: ${process.env.PAYNOW_INTEGRATION_ID ? 'Enabled' : 'Disabled (set PAYNOW_INTEGRATION_ID in .env)'}
  `);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('✓ HTTP server closed');
    
    mongoose.connection.close(false, () => {
      console.log('✓ MongoDB connection closed');
      console.log('✓ Graceful shutdown complete');
      process.exit(0);
    });
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('✗ Could not close connections in time, forcing shutdown');
    process.exit(1);
  }, 10000);
};

// Handle different shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('✗ Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('✗ Unhandled Rejection:', err);
  gracefulShutdown('unhandledRejection');
});

module.exports = app;