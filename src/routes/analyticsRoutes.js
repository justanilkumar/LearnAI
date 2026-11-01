const express = require('express');
const router = express.Router();
const {
  getInstructorAnalytics,
  getStudentAnalytics,
  getPlatformOverview
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/instructor', protect, authorize('instructor', 'admin'), getInstructorAnalytics);
router.get('/student', protect, getStudentAnalytics);
router.get('/platform', getPlatformOverview);

module.exports = router;
