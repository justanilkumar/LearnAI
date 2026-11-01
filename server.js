const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { connectDB } = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

// Route files
const authRoutes = require('./src/routes/authRoutes');
const courseRoutes = require('./src/routes/courseRoutes');
const lessonRoutes = require('./src/routes/lessonRoutes');
const quizRoutes = require('./src/routes/quizRoutes');
const enrollmentRoutes = require('./src/routes/enrollmentRoutes');
const certificateRoutes = require('./src/routes/certificateRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const { seedDatabase } = require('./src/seeds/seedData');

// Initialize app
const app = express();

// Body parser & CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// HTTP Request Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve Frontend Static Assets
app.use(express.static(path.join(__dirname, 'public')));

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Learnify LMS API',
    database: 'MongoDB / Mongoose ODM'
  });
});

// Seed API endpoint for easy interactive demo reset
app.post('/api/seed', async (req, res, next) => {
  try {
    await seedDatabase({ silent: true });
    res.status(200).json({
      success: true,
      message: 'Database re-seeded successfully with fresh demo data!'
    });
  } catch (err) {
    next(err);
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/analytics', analyticsRoutes);

// Fallback SPA route for client-side routing (Express 5 compatible)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5050;

// Connect to Database and start server
const startServer = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`
======================================================
  🎓 Learnify LMS - Learning Management System
======================================================
  🚀 Server Running: http://localhost:${PORT}
  📚 API Docs & Explorer: http://localhost:${PORT}#api-docs
  📊 Instructor Analytics: http://localhost:${PORT}#instructor
  🎓 Student Learning Portal: http://localhost:${PORT}#student
  📜 Certificate Verification: http://localhost:${PORT}#verify
======================================================
    `);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection Error: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

startServer();

module.exports = app;
