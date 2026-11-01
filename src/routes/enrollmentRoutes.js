const express = require('express');
const router = express.Router();
const { getMyEnrollments } = require('../controllers/enrollmentController');
const { protect } = require('../middleware/auth');

router.get('/my', protect, getMyEnrollments);

module.exports = router;
