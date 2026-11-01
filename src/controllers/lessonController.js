const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc    Get lessons for a course
// @route   GET /api/courses/:courseId/lessons
// @access  Public
exports.getLessonsByCourse = async (req, res, next) => {
  try {
    const lessons = await Lesson.find({ course: req.params.courseId })
      .sort({ order: 1 })
      .select('title moduleTitle durationMinutes isFreePreview order');

    res.status(200).json({
      success: true,
      count: lessons.length,
      lessons
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single lesson content (for the learning player)
// @route   GET /api/lessons/:id
// @access  Public / Private
exports.getLessonById = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    // Access check: allow if free preview, or if enrolled, or if instructor/admin
    if (!lesson.isFreePreview) {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Please log in to access this premium lesson.'
        });
      }

      if (req.user.role === 'student') {
        const enrollment = await Enrollment.findOne({
          student: req.user._id,
          course: lesson.course
        });

        if (!enrollment) {
          return res.status(403).json({
            success: false,
            message: 'You must enroll in this course to access this lesson.'
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      lesson
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new lesson
// @route   POST /api/courses/:courseId/lessons
// @access  Private (Instructor or Admin)
exports.createLesson = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Auto calculate order if not specified
    if (!req.body.order) {
      const highestOrder = await Lesson.findOne({ course: course._id }).sort('-order');
      req.body.order = highestOrder ? highestOrder.order + 1 : 1;
    }

    req.body.course = course._id;
    const lesson = await Lesson.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      lesson
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update lesson
// @route   PUT /api/lessons/:id
// @access  Private (Instructor or Admin)
exports.updateLesson = async (req, res, next) => {
  try {
    let lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const course = await Course.findById(lesson.course);
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      lesson
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete lesson
// @route   DELETE /api/lessons/:id
// @access  Private (Instructor or Admin)
exports.deleteLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const course = await Course.findById(lesson.course);
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await lesson.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Lesson removed'
    });
  } catch (err) {
    next(err);
  }
};
