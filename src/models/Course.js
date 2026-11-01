const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    slug: {
      type: String,
      lowercase: true,
      index: true
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [200, 'Subtitle cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Course description is required']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Web Development',
        'Database & Backend',
        'System Design',
        'Data Science & AI',
        'DevOps & Cloud',
        'Algorithms & DS'
      ]
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
      default: 'Beginner'
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price must be 0 or higher']
    },
    thumbnail: {
      type: String,
      default: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80'
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Course must have an assigned instructor']
    },
    isPublished: {
      type: Boolean,
      default: true
    },
    tags: [{
      type: String,
      trim: true
    }],
    durationHours: {
      type: Number,
      default: 5
    },
    averageRating: {
      type: Number,
      default: 4.8,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    ratingsCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// MongoDB compound & text indexes
courseSchema.index({ category: 1, level: 1, isPublished: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index(
  { title: 'text', description: 'text', tags: 'text' },
  { weights: { title: 5, tags: 3, description: 1 } }
);

// Virtual populate for lessons
courseSchema.virtual('lessons', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'course',
  justOne: false,
  options: { sort: { order: 1 } }
});

// Virtual populate for reviews
courseSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'course',
  justOne: false
});

// Virtual populate for quizzes
courseSchema.virtual('quizzes', {
  ref: 'Quiz',
  localField: '_id',
  foreignField: 'course',
  justOne: false
});

// Generate URL slug from title before saving
courseSchema.pre('save', function () {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }
});

module.exports = mongoose.model('Course', courseSchema);
