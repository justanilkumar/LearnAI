const Review = require('../models/Review');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc    Add review for a course
// @route   POST /api/courses/:courseId/reviews
// @access  Private (Student)
exports.addReview = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { rating, comment } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if enrolled
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You can only review courses you have enrolled in.'
      });
    }

    // Check if existing review
    let review = await Review.findOne({
      course: courseId,
      student: req.user._id
    });

    if (review) {
      review.rating = rating;
      review.comment = comment;
      await review.save();
      return res.status(200).json({
        success: true,
        message: 'Your review was updated successfully!',
        review
      });
    }

    review = await Review.create({
      course: courseId,
      student: req.user._id,
      rating,
      comment
    });

    res.status(201).json({
      success: true,
      message: 'Review posted successfully!',
      review
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all reviews for a course
// @route   GET /api/courses/:courseId/reviews
// @access  Public
exports.getCourseReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ course: req.params.courseId })
      .populate('student', 'name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (err) {
    next(err);
  }
};
