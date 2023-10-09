const mongoose = require('mongoose');
const Tour = require('./tourModel');

// 1) CREATE SCHEMA
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
      minLength: [10, 'review must be more than 10 character'],
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.'],
      required: [true, 'Must provide a rating'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      // Reference Tour Document ID
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'review must belong to a tour'],
    },
    user: {
      // Reference User Document ID
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// QUERY MIDDLEWARE (Any Query start with find) -> TO POPULATE
reviewSchema.pre(/^find/, function (next) {
  // Populate 'tour' field and select only specific fields
  this.populate({
    path: 'user',
    select: 'name photo', // Add the fields you want to select
  });

  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  // console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5, // DEFAULT WHEN THERE IS NO REVIEW
    });
  }
};

reviewSchema.post('save', function () {
  //this point to current review

  this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndDelete // query middleware
// findByIdAndUpdate // query middleware

// reviewSchema.pre(/^findOneAnd/, async function (next) {
//   this.r = await this.findOne().clone();
//   console.log(this.r);
//   next();
// });

reviewSchema.post(/^findOneAnd/, async function (doc, next) {
  console.log(`Updated Doc :  ${doc}`);
  doc.constructor.calcAverageRatings(doc.tour);
  next();
});

// Create a model from the shema
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
