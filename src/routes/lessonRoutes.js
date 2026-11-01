const express = require('express');
const router = express.Router();
const {
  getLessonById,
  updateLesson,
  deleteLesson
} = require('../controllers/lessonController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router
  .route('/:id')
  .get(optionalAuth, getLessonById)
  .put(protect, authorize('instructor', 'admin'), updateLesson)
  .delete(protect, authorize('instructor', 'admin'), deleteLesson);

module.exports = router;
