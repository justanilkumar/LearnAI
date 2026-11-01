const express = require('express');
const router = express.Router();
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCategoriesStats
} = require('../controllers/courseController');
const {
  getLessonsByCourse,
  createLesson
} = require('../controllers/lessonController');
const {
  getQuizByCourse,
  createQuiz
} = require('../controllers/quizController');
const {
  enrollInCourse,
  completeLesson,
  getCourseProgress
} = require('../controllers/enrollmentController');
const {
  issueCertificate
} = require('../controllers/certificateController');
const {
  addReview,
  getCourseReviews
} = require('../controllers/reviewController');

const { protect, authorize, optionalAuth } = require('../middleware/auth');

// Categories stats
router.get('/meta/categories', getCategoriesStats);

// Main course collection routes
router
  .route('/')
  .get(getCourses)
  .post(protect, authorize('instructor', 'admin'), createCourse);

router
  .route('/:id')
  .get(optionalAuth, getCourseById)
  .put(protect, authorize('instructor', 'admin'), updateCourse)
  .delete(protect, authorize('instructor', 'admin'), deleteCourse);

// Nested sub-resource: Lessons
router
  .route('/:courseId/lessons')
  .get(getLessonsByCourse)
  .post(protect, authorize('instructor', 'admin'), createLesson);

// Nested sub-resource: Quiz
router
  .route('/:courseId/quiz')
  .get(optionalAuth, getQuizByCourse)
  .post(protect, authorize('instructor', 'admin'), createQuiz);

// Nested sub-resource: Enrollment & Progress
router.post('/:courseId/enroll', protect, enrollInCourse);
router.get('/:courseId/progress', protect, getCourseProgress);
router.post('/:courseId/lessons/:lessonId/complete', protect, completeLesson);

// Nested sub-resource: Certificate
router.post('/:courseId/certificate', protect, issueCertificate);

// Nested sub-resource: Reviews
router
  .route('/:courseId/reviews')
  .get(getCourseReviews)
  .post(protect, addReview);

module.exports = router;
