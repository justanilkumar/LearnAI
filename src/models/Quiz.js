const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question text is required']
  },
  options: {
    type: [String],
    validate: {
      validator: function (opts) {
        return Array.isArray(opts) && opts.length >= 2;
      },
      message: 'A question must provide at least 2 options'
    }
  },
  correctOptionIndex: {
    type: Number,
    required: [true, 'Correct option index is required'],
    min: 0
  },
  explanation: {
    type: String,
    default: 'Correct answer explanation'
  }
});

const quizSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Quiz must belong to a course'],
      index: true
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    },
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true
    },
    description: {
      type: String,
      default: 'Test your understanding of the concepts covered.'
    },
    passingScorePercentage: {
      type: Number,
      default: 70,
      min: 0,
      max: 100
    },
    questions: [questionSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Quiz', quizSchema);
