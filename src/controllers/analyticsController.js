const mongoose = require('mongoose');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Quiz = require('../models/Quiz');

// @desc    Instructor Dashboard Analytics via Multi-Stage Aggregation Pipelines
// @route   GET /api/analytics/instructor
// @access  Private (Instructor or Admin)
exports.getInstructorAnalytics = async (req, res, next) => {
  try {
    const instructorId = new mongoose.Types.ObjectId(req.user.id);

    // Pipeline 1: Overall KPIs (Students, Revenue, Completion Rate)
    const kpiAggregation = await Course.aggregate([
      // Stage 1: Match courses created by this instructor
      { $match: { instructor: instructorId } },

      // Stage 2: Join with enrollments
      {
        $lookup: {
          from: 'enrollments',
          localField: '_id',
          foreignField: 'course',
          as: 'enrollments'
        }
      },

      // Stage 3: Unwind enrollments (keeping courses even with 0 enrollments)
      {
        $unwind: {
          path: '$enrollments',
          preserveNullAndEmptyArrays: true
        }
      },

      // Stage 4: Group to calculate platform metrics
      {
        $group: {
          _id: null,
          totalCourses: { $addToSet: '$_id' },
          totalEnrollments: {
            $sum: { $cond: [{ $ifNull: ['$enrollments._id', false] }, 1, 0] }
          },
          totalRevenue: {
            $sum: { $cond: [{ $ifNull: ['$enrollments._id', false] }, '$price', 0] }
          },
          avgCompletionRate: { $avg: '$enrollments.progressPercentage' },
          completedCertificates: {
            $sum: {
              $cond: [{ $eq: ['$enrollments.status', 'completed'] }, 1, 0]
            }
          }
        }
      },

      // Stage 5: Format output
      {
        $project: {
          _id: 0,
          totalCoursesCount: { $size: '$totalCourses' },
          totalEnrollments: 1,
          totalRevenue: 1,
          avgCompletionRate: { $round: [{ $ifNull: ['$avgCompletionRate', 0] }, 1] },
          completedCertificates: 1
        }
      }
    ]);

    const kpis = kpiAggregation[0] || {
      totalCoursesCount: 0,
      totalEnrollments: 0,
      totalRevenue: 0,
      avgCompletionRate: 0,
      completedCertificates: 0
    };

    // Pipeline 2: Course-by-Course Performance Breakdown
    const courseBreakdown = await Course.aggregate([
      { $match: { instructor: instructorId } },
      {
        $lookup: {
          from: 'enrollments',
          localField: '_id',
          foreignField: 'course',
          as: 'enrollments'
        }
      },
      {
        $project: {
          title: 1,
          category: 1,
          level: 1,
          price: 1,
          averageRating: 1,
          ratingsCount: 1,
          studentCount: { $size: '$enrollments' },
          estimatedRevenue: {
            $multiply: ['$price', { $size: '$enrollments' }]
          },
          avgCourseProgress: {
            $round: [{ $avg: '$enrollments.progressPercentage' }, 1]
          }
        }
      },
      { $sort: { studentCount: -1 } }
    ]);

    // Pipeline 3: Monthly Enrollment Trend using Date Expressions
    const monthlyTrends = await Course.aggregate([
      { $match: { instructor: instructorId } },
      {
        $lookup: {
          from: 'enrollments',
          localField: '_id',
          foreignField: 'course',
          as: 'enrollment'
        }
      },
      { $unwind: '$enrollment' },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$enrollment.createdAt' }
          },
          newEnrollments: { $sum: 1 },
          monthlyRevenue: { $sum: '$price' }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          month: '$_id',
          newEnrollments: 1,
          monthlyRevenue: 1,
          _id: 0
        }
      }
    ]);

    // Pipeline 4: Student Quiz Performance across instructor's courses
    const instructorCourses = await Course.find({ instructor: instructorId }).select('_id');
    const courseIds = instructorCourses.map((c) => c._id);

    const quizPerformance = await Enrollment.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $unwind: '$quizAttempts' },
      {
        $group: {
          _id: '$quizAttempts.quiz',
          totalAttempts: { $sum: 1 },
          avgScore: { $avg: '$quizAttempts.scorePercentage' },
          passedCount: {
            $sum: { $cond: ['$quizAttempts.passed', 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'quizzes',
          localField: '_id',
          foreignField: '_id',
          as: 'quizDetails'
        }
      },
      { $unwind: '$quizDetails' },
      {
        $project: {
          quizTitle: '$quizDetails.title',
          totalAttempts: 1,
          avgScore: { $round: ['$avgScore', 1] },
          passRatePercentage: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$passedCount', { $max: ['$totalAttempts', 1] }] },
                  100
                ]
              },
              1
            ]
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      kpis,
      courseBreakdown,
      monthlyTrends,
      quizPerformance
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Student Learning Stats via Aggregation
// @route   GET /api/analytics/student
// @access  Private (Student)
exports.getStudentAnalytics = async (req, res, next) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.user.id);

    const stats = await Enrollment.aggregate([
      { $match: { student: studentId } },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseDetails'
        }
      },
      { $unwind: '$courseDetails' },
      {
        $group: {
          _id: null,
          totalEnrolled: { $sum: 1 },
          completedCourses: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          inProgressCourses: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          },
          avgProgress: { $avg: '$progressPercentage' },
          totalCompletedLessons: { $sum: { $size: '$completedLessons' } }
        }
      },
      {
        $project: {
          _id: 0,
          totalEnrolled: 1,
          completedCourses: 1,
          inProgressCourses: 1,
          avgProgress: { $round: [{ $ifNull: ['$avgProgress', 0] }, 1] },
          totalCompletedLessons: 1
        }
      }
    ]);

    const certificatesCount = await Certificate.countDocuments({ student: studentId });

    res.status(200).json({
      success: true,
      stats: stats[0] || {
        totalEnrolled: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        avgProgress: 0,
        totalCompletedLessons: 0
      },
      certificatesCount
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Platform-wide Overview Analytics
// @route   GET /api/analytics/platform
// @access  Public
exports.getPlatformOverview = async (req, res, next) => {
  try {
    const [userStats, totalCourses, totalEnrollments, topRated] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]),
      Course.countDocuments({ isPublished: true }),
      Enrollment.countDocuments({}),
      Course.find({ isPublished: true })
        .sort({ averageRating: -1, ratingsCount: -1 })
        .limit(4)
        .select('title category level averageRating ratingsCount price thumbnail')
    ]);

    res.status(200).json({
      success: true,
      platform: {
        userDistribution: userStats,
        totalCourses,
        totalEnrollments,
        topRated
      }
    });
  } catch (err) {
    next(err);
  }
};
