const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc    Get quiz for a course (sanitized questions without answers for students)
// @route   GET /api/courses/:courseId/quiz
// @access  Public / Enrolled
exports.getQuizByCourse = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ course: req.params.courseId });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'No quiz found for this course'
      });
    }

    // Determine if user is instructor or student
    const isInstructor = req.user && (req.user.role === 'instructor' || req.user.role === 'admin');

    if (isInstructor) {
      // Instructors see full questions including correct answers
      return res.status(200).json({ success: true, quiz });
    }

    // Sanitize quiz for students: strip out correctOptionIndex & explanation
    const sanitizedQuestions = quiz.questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options
    }));

    res.status(200).json({
      success: true,
      quiz: {
        _id: quiz._id,
        course: quiz.course,
        title: quiz.title,
        description: quiz.description,
        passingScorePercentage: quiz.passingScorePercentage,
        totalQuestions: quiz.questions.length,
        questions: sanitizedQuestions
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit quiz attempt, auto-grade and record attempt
// @route   POST /api/quizzes/:quizId/submit
// @access  Private (Student)
exports.submitQuizAttempt = async (req, res, next) => {
  try {
    const { answers } = req.body; // array of { questionId, selectedOption } or array of chosen indices
    const quiz = await Quiz.findById(req.params.quizId);

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: quiz.course
    });

    if (!enrollment) {
      return res.status(400).json({
        success: false,
        message: 'You must be enrolled in this course to take the quiz.'
      });
    }

    // Grade each question
    let correctCount = 0;
    const results = quiz.questions.map((q, index) => {
      const studentSelected = Array.isArray(answers) ? answers[index] : answers[q._id.toString()];
      const isCorrect = studentSelected === q.correctOptionIndex;
      if (isCorrect) correctCount++;

      return {
        questionId: q._id,
        question: q.question,
        options: q.options,
        studentSelected,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect,
        explanation: q.explanation
      };
    });

    const scorePercentage = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = scorePercentage >= quiz.passingScorePercentage;

    // Push attempt to enrollment
    enrollment.quizAttempts.push({
      quiz: quiz._id,
      scorePercentage,
      passed,
      attemptedAt: new Date()
    });

    await enrollment.save();

    res.status(200).json({
      success: true,
      summary: {
        totalQuestions: quiz.questions.length,
        correctCount,
        scorePercentage,
        passingScore: quiz.passingScorePercentage,
        passed,
        message: passed
          ? `🎉 Congratulations! You passed the quiz with ${scorePercentage}%.`
          : `⚠️ You scored ${scorePercentage}%. Minimum required is ${quiz.passingScorePercentage}%. Please review and try again.`
      },
      results
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create quiz for course
// @route   POST /api/courses/:courseId/quiz
// @access  Private (Instructor or Admin)
exports.createQuiz = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    req.body.course = course._id;
    const quiz = await Quiz.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      quiz
    });
  } catch (err) {
    next(err);
  }
};
