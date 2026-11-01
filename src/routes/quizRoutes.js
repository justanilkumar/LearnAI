const express = require('express');
const router = express.Router();
const { submitQuizAttempt } = require('../controllers/quizController');
const { protect } = require('../middleware/auth');

router.post('/:quizId/submit', protect, submitQuizAttempt);

module.exports = router;
