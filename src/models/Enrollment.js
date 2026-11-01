const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  scorePercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  passed: {
    type: Boolean,
    required: true
  },
  attemptedAt: {
    type: Date,
    default: Date.now
  }
});

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true
    },
    completedLessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson'
      }
    ],
    quizAttempts: [quizAttemptSchema],
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed'],
      default: 'in-progress'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound Unique Index: Prevent duplicate enrollments for the same student + course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ status: 1 });

// Helper method to recompute progress percentage
enrollmentSchema.methods.recalculateProgress = function (totalLessonsCount) {
  if (!totalLessonsCount || totalLessonsCount === 0) {
    this.progressPercentage = 0;
    return;
  }
  
  // Deduplicate completed lesson ids
  const uniqueCompleted = new Set(this.completedLessons.map((id) => id.toString()));
  const pct = Math.min(100, Math.round((uniqueCompleted.size / totalLessonsCount) * 100));
  this.progressPercentage = pct;
  
  if (pct === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completedAt = new Date();
  } else if (pct < 100 && this.status === 'completed') {
    this.status = 'in-progress';
    this.completedAt = null;
  }
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);
