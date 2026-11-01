const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Certificate = require('../models/Certificate');

// @desc    Enroll in a course
// @route   POST /api/courses/:courseId/enroll
// @access  Private (Student)
exports.enrollInCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({
      student: req.user._id,
      course: course._id
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course.',
        enrollment: existing
      });
    }

    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: course._id,
      progressPercentage: 0,
      completedLessons: []
    });

    res.status(201).json({
      success: true,
      message: `Successfully enrolled in ${course.title}!`,
      enrollment
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all enrollments for logged in student
// @route   GET /api/enrollments/my
// @access  Private (Student)
exports.getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate({
        path: 'course',
        select: 'title category level thumbnail durationHours price averageRating instructor',
        populate: { path: 'instructor', select: 'name avatar headline' }
      })
      .sort({ lastAccessedAt: -1 });

    // Attach certificate status for each
    const enrollmentData = await Promise.all(
      enrollments.map(async (enr) => {
        const cert = await Certificate.findOne({
          student: req.user._id,
          course: enr.course._id
        });
        const totalLessons = await Lesson.countDocuments({ course: enr.course._id });

        return {
          ...enr.toObject(),
          totalLessons,
          hasCertificate: !!cert,
          certificateId: cert ? cert.certificateId : null
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrollmentData.length,
      enrollments: enrollmentData
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark a lesson as completed
// @route   POST /api/courses/:courseId/lessons/:lessonId/complete
// @access  Private (Student)
exports.completeLesson = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.params;

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment record not found for this course.'
      });
    }

    // Add lesson to completedLessons if not already present
    const lessonObjectId = lessonId.toString();
    const alreadyCompleted = enrollment.completedLessons.some(
      (id) => id.toString() === lessonObjectId
    );

    if (!alreadyCompleted) {
      enrollment.completedLessons.push(lessonId);
    }

    // Total lessons in this course
    const totalLessons = await Lesson.countDocuments({ course: courseId });
    enrollment.recalculateProgress(totalLessons);
    enrollment.lastAccessedAt = new Date();

    await enrollment.save();

    // Check certificate eligibility
    const isEligibleForCertificate = enrollment.progressPercentage === 100;

    res.status(200).json({
      success: true,
      message: 'Lesson marked as completed!',
      progressPercentage: enrollment.progressPercentage,
      status: enrollment.status,
      completedLessonsCount: enrollment.completedLessons.length,
      totalLessons,
      isEligibleForCertificate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get progress details for a course
// @route   GET /api/courses/:courseId/progress
// @access  Private (Student)
exports.getCourseProgress = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: req.params.courseId
    }).populate('completedLessons', 'title order durationMinutes');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Not enrolled in this course.'
      });
    }

    const totalLessons = await Lesson.countDocuments({ course: req.params.courseId });
    const certificate = await Certificate.findOne({
      student: req.user._id,
      course: req.params.courseId
    });

    res.status(200).json({
      success: true,
      progressPercentage: enrollment.progressPercentage,
      status: enrollment.status,
      completedLessons: enrollment.completedLessons,
      quizAttempts: enrollment.quizAttempts,
      totalLessons,
      certificate
    });
  } catch (err) {
    next(err);
  }
};
