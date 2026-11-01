const express = require('express');
const router = express.Router();
const {
  verifyCertificate,
  getMyCertificates
} = require('../controllers/certificateController');
const { protect } = require('../middleware/auth');

router.get('/verify/:certificateId', verifyCertificate);
router.get('/my', protect, getMyCertificates);

module.exports = router;
