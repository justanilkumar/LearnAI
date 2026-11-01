const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5'],
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: [true, 'Please provide review comments'],
      trim: true,
      maxlength: [600, 'Review cannot exceed 600 characters']
    }
  },
  {
    timestamps: true
  }
);

// One review per student per course
reviewSchema.index({ course: 1, student: 1 }, { unique: true });

// Static method on Review model: Calculate average rating using MongoDB Aggregation
reviewSchema.statics.calculateAverageRating = async function (courseId) {
  const stats = await this.aggregate([
    {
      $match: { course: new mongoose.Types.ObjectId(courseId) }
    },
    {
      $group: {
        _id: '$course',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);

  try {
    if (stats.length > 0) {
      await mongoose.model('Course').findByIdAndUpdate(courseId, {
        averageRating: Math.round(stats[0].avgRating * 10) / 10,
        ratingsCount: stats[0].count
      });
    } else {
      await mongoose.model('Course').findByIdAndUpdate(courseId, {
        averageRating: 0,
        ratingsCount: 0
      });
    }
  } catch (err) {
    console.error('Error updating course average rating in aggregate:', err);
  }
};

// Call calculateAverageRating after save
reviewSchema.post('save', async function () {
  await this.constructor.calculateAverageRating(this.course);
});

// Call calculateAverageRating after delete
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.calculateAverageRating(doc.course);
  }
});

module.exports = mongoose.model('Review', reviewSchema);
