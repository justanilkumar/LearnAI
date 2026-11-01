const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Quiz = require('../models/Quiz');

// @desc    Get all courses with filtering, search, sorting & pagination
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res, next) => {
  try {
    const { category, level, search, sort, page = 1, limit = 9, price } = req.query;

    const query = { isPublished: true };

    // Filter by Category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Filter by Level
    if (level && level !== 'All') {
      query.level = level;
    }

    // Filter by Price (free vs paid)
    if (price === 'free') {
      query.price = 0;
    } else if (price === 'paid') {
      query.price = { $gt: 0 };
    }

    // Full-Text or Regex Search across title, tags, description
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { tags: searchRegex },
        { subtitle: searchRegex },
        { description: searchRegex }
      ];
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // default newest
    if (sort === 'rating') {
      sortOption = { averageRating: -1 };
    } else if (sort === 'price-low') {
      sortOption = { price: 1 };
    } else if (sort === 'price-high') {
      sortOption = { price: -1 };
    } else if (sort === 'popular') {
      sortOption = { ratingsCount: -1 };
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 9;
    const skip = (pageNum - 1) * limitNum;

    const total = await Course.countDocuments(query);
    const courses = await Course.find(query)
      .populate('instructor', 'name email avatar headline')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: courses.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      courses
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single course with populated lessons, quizzes & reviews
// @route   GET /api/courses/:id
// @access  Public (with optional user context)
exports.getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email avatar headline bio')
      .populate({
        path: 'lessons',
        options: { sort: { order: 1 } },
        select: 'title moduleTitle durationMinutes isFreePreview order'
      })
      .populate({
        path: 'quizzes',
        select: 'title description passingScorePercentage questions'
      })
      .populate({
        path: 'reviews',
        populate: { path: 'student', select: 'name avatar' }
      });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if current user is enrolled
    let isEnrolled = false;
    let enrollment = null;
    if (req.user) {
      enrollment = await Enrollment.findOne({
        student: req.user._id,
        course: course._id
      });
      isEnrolled = !!enrollment;
    }

    res.status(200).json({
      success: true,
      course,
      isEnrolled,
      enrollment
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Instructor or Admin)
exports.createCourse = async (req, res, next) => {
  try {
    req.body.instructor = req.user.id;

    const course = await Course.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Instructor owner or Admin)
exports.updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Ensure user is course instructor or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      course
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete course and associated resources
// @route   DELETE /api/courses/:id
// @access  Private (Instructor owner or Admin)
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this course'
      });
    }

    // Cascade delete lessons and quizzes
    await Lesson.deleteMany({ course: course._id });
    await Quiz.deleteMany({ course: course._id });
    await Enrollment.deleteMany({ course: course._id });
    await course.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Course and related lessons deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Category Aggregation & Counts
// @route   GET /api/courses/meta/categories
// @access  Public
exports.getCategoriesStats = async (req, res, next) => {
  try {
    const categoryStats = await Course.aggregate([
      { $match: { isPublished: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgRating: { $avg: '$averageRating' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      categories: categoryStats
    });
  } catch (err) {
    next(err);
  }
};
