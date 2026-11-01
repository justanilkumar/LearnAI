const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Lesson must belong to a course'],
      index: true
    },
    moduleTitle: {
      type: String,
      default: 'Module 1: Core Fundamentals'
    },
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    description: {
      type: String,
      default: ''
    },
    videoUrl: {
      type: String,
      default: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ' // Safe embed or demo video
    },
    durationMinutes: {
      type: Number,
      default: 15,
      min: [1, 'Duration must be at least 1 minute']
    },
    content: {
      type: String,
      default: ''
    },
    order: {
      type: Number,
      required: true,
      default: 1
    },
    isFreePreview: {
      type: Boolean,
      default: false
    },
    resources: [
      {
        title: String,
        url: String
      }
    ]
  },
  {
    timestamps: true
  }
);

// Compound index on course and order for fast syllabus retrieval
lessonSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
