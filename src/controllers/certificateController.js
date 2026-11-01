const crypto = require('crypto');
const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

// @desc    Issue a course completion certificate
// @route   POST /api/courses/:courseId/certificate
// @access  Private (Student)
exports.issueCertificate = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId
    });


    if (!enrollment) {
      return res.status(400).json({
        success: false,
        message: 'You are not enrolled in this course.'
      });
    }

    if (enrollment.progressPercentage < 100) {
      return res.status(400).json({
        success: false,
        message: `Course incomplete (${enrollment.progressPercentage}%). Complete 100% of lessons to unlock your certificate.`
      });
    }

    // Check if certificate already exists
    let certificate = await Certificate.findOne({
      student: req.user._id,
      course: courseId
    }).populate('course', 'title category durationHours instructor').populate('student', 'name email');

    if (certificate) {
      return res.status(200).json({
        success: true,
        message: 'Certificate already issued for this course.',
        certificate
      });
    }

    // Generate unique verifiable Certificate ID
    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const certificateId = `LMS-${year}-${randomHex}`;
    const verificationHash = crypto
      .createHash('sha256')
      .update(`${certificateId}-${req.user._id}-${courseId}-${Date.now()}`)
      .digest('hex');

    certificate = await Certificate.create({
      certificateId,
      student: req.user._id,
      course: course._id,
      enrollment: enrollment._id,
      issuedAt: new Date(),
      grade: 'Distinction (Honor Roll)',
      verificationHash
    });

    certificate = await Certificate.findById(certificate._id)
      .populate('course', 'title category durationHours instructor')
      .populate('student', 'name email');

    res.status(201).json({
      success: true,
      message: '🎉 Congratulations! Your certificate has been issued.',
      certificate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify a certificate by certificate ID
// @route   GET /api/certificates/verify/:certificateId
// @access  Public
exports.verifyCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findOne({
      certificateId: req.params.certificateId.toUpperCase()
    })
      .populate('course', 'title category durationHours')
      .populate('student', 'name email avatar')
      .populate({
        path: 'course',
        populate: { path: 'instructor', select: 'name headline' }
      });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Certificate ID not recognized in Learnify official records.'
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      message: 'Verified Official Learnify Certificate',
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.student.name,
        studentAvatar: certificate.student.avatar,
        courseTitle: certificate.course.title,
        courseCategory: certificate.course.category,
        instructorName: certificate.course.instructor ? certificate.course.instructor.name : 'Learnify Faculty',
        issuedAt: certificate.issuedAt,
        grade: certificate.grade,
        verificationHash: certificate.verificationHash
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all certificates of logged-in student
// @route   GET /api/certificates/my
// @access  Private (Student)
exports.getMyCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find({ student: req.user._id })
      .populate('course', 'title thumbnail category durationHours')
      .populate('student', 'name email')
      .sort({ issuedAt: -1 });

    res.status(200).json({
      success: true,
      count: certificates.length,
      certificates
    });
  } catch (err) {
    next(err);
  }
};
