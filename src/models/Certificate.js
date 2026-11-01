const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true
    },
    issuedAt: {
      type: Date,
      default: Date.now
    },
    grade: {
      type: String,
      default: 'Passed with Excellence'
    },
    verificationHash: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

certificateSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Certificate', certificateSchema);
