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

// ==================== CORS Configuration ====================
// Allow multiple origins for development and production
const allowedOrigins = [
  'http://localhost:3000',                    // Local backend development
  'http://localhost:5173',                    // Vite frontend (common port)
  'http://localhost:8080',                    // Alternative frontend port
  'https://school-management-backend-pxbk.onrender.com',  // Your Render backend
  // Add your frontend URL here when you deploy it to Render:
  // 'https://your-frontend-app.onrender.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies/auth headers if needed
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ==================== Request Logging Middleware ====================
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== Dynamic Base URL ====================
// Get the base URL for the current environment
const getBaseUrl = () => {
  // Use Render's URL when deployed, otherwise localhost
  if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
    return `https://school-management-backend-pxbk.onrender.com`;
  }
  return `http://localhost:${process.env.PORT || 3000}`;
};

const BASE_URL = getBaseUrl();

// ==================== Swagger Configuration ====================
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
        url: BASE_URL,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      },
      {
        url: 'http://localhost:3000',
        description: 'Local development server'
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

// ==================== Routes ====================
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/receptionist', receptionistRoutes);
app.use('/api/paynow', paynowRoutes); // PayNow payment routes

// ==================== Basic Routes ====================
app.get('/', (req, res) => {
  res.json({ 
    message: 'School Management API is running!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    baseUrl: BASE_URL,
    features: [
      'Student Management',
      'Teacher Management',
      'Fee Management',
      'Online Payments (PayNow)',
      'Admin Dashboard',
      'Receptionist Portal'
    ],
    endpoints: {
      docs: `${BASE_URL}/api-docs`,
      health: `${BASE_URL}/health`,
      auth: `${BASE_URL}/api/auth`,
      students: `${BASE_URL}/api/students`,
      teachers: `${BASE_URL}/api/teachers`,
      fees: `${BASE_URL}/api/fees`,
      paynow: `${BASE_URL}/api/paynow`,
      admin: `${BASE_URL}/api/admin`,
      receptionist: `${BASE_URL}/api/receptionist`
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    baseUrl: BASE_URL,
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

// ==================== Database Connection ====================
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✓ MongoDB Connected');
    
    // Create indexes for better performance
    try {
      await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
      await mongoose.connection.db.collection('users').createIndex({ username: 1 }, { unique: true });
      await mongoose.connection.db.collection('students').createIndex({ studentId: 1 }, { unique: true });
      await mongoose.connection.db.collection('teachers').createIndex({ teacherId: 1 }, { unique: true });
      console.log('✓ Database indexes created/verified');
    } catch (indexError) {
      console.log('⚠️ Index creation warning (might already exist):', indexError.message);
    }
    
    return true;
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    console.log('\n⚠️ Database Troubleshooting:');
    console.log('1. Check MONGODB_URI in environment variables');
    console.log('2. Verify MongoDB Atlas IP whitelist includes Render IPs');
    console.log('3. Check database user permissions');
    console.log('4. Server will start without database connection');
    
    return false;
  }
};

// ==================== Error Handling Middleware ====================
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: `CORS Error: Origin '${req.headers.origin}' not allowed`,
      allowedOrigins: allowedOrigins
    });
  }
  
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
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    baseUrl: BASE_URL
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedUrl: req.originalUrl,
    baseUrl: BASE_URL,
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

// ==================== Start Server ====================
const startServer = async () => {
  const PORT = process.env.PORT || 3000;
  
  // Connect to database
  const dbConnected = await connectDB();
  
  const server = app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════════════════╗
    ║                                                      ║
    ║    SCHOOL MANAGEMENT SYSTEM API                      ║
    ║    Version: 1.0.0                                    ║
    ║                                                      ║
    ╚══════════════════════════════════════════════════════╝
    
    ✓ Server running on port ${PORT}
    📚 API Documentation: ${BASE_URL}/api-docs
    🏥 Health check: ${BASE_URL}/health
    📊 Database: ${dbConnected ? 'Connected' : 'Disconnected'}
    
    Available Endpoints:
    🔐 Auth:          ${BASE_URL}/api/auth
    👨‍🎓 Students:      ${BASE_URL}/api/students
    👩‍🏫 Teachers:      ${BASE_URL}/api/teachers
    💰 Fees:          ${BASE_URL}/api/fees
    💳 PayNow:        ${BASE_URL}/api/paynow
    👨‍💼 Admin:        ${BASE_URL}/api/admin
    🏢 Receptionist:  ${BASE_URL}/api/receptionist
    
    Environment: ${process.env.NODE_ENV || 'development'}
    CORS Allowed Origins: ${allowedOrigins.join(', ')}
    PayNow Integration: ${process.env.PAYNOW_INTEGRATION_ID ? 'Enabled' : 'Disabled (check .env)'}
    `);
  });
  
  // Graceful shutdown
  const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    
    server.close(() => {
      console.log('✓ HTTP server closed');
      
      if (mongoose.connection.readyState === 1) {
        mongoose.connection.close(false, () => {
          console.log('✓ MongoDB connection closed');
          console.log('✓ Graceful shutdown complete');
          process.exit(0);
        });
      } else {
        console.log('✓ Graceful shutdown complete');
        process.exit(0);
      }
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
  
  return server;
};

// Start the server
if (require.main === module) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = app;