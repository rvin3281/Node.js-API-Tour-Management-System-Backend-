//----- (3rd LIBRARY) IMPORT MONGOOSE PACKAGE
const mongoose = require('mongoose');
// Require Slugify
const slugify = require('slugify');

// const User = require('./userModel');

// Require the validator
const validator = require('validator');

/** MONGOOSE -PRACTISE SCHEMA */
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'a tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters'],
      // validate: [validator., 'Tour Name Must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document creation
          return val < this.price; // 100 < 200 => true
        },

        message: 'Discount price ({VALUE}) should be below the regular price',
      },
    },
    summary: {
      type: String,
      trim: true, // trim only works for string // remove white space at the begining and end
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJson
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'], // array of possible option that this fields can take
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// tourSchema.index({ price: 1 }); // 1 => Sorting the price index in ascending order
tourSchema.index({ price: 1, ratingsAverage: -1 }); // 1 => Sorting the price index in ascending order
tourSchema.index({ slug: 1 });

/** VIRTUAL PROPERTY */
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

/** VIRTUAL POPULATE */
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // The name of the field in the other model where the reference to the current model is stored
  localField: '_id',
});

// PRE DOCUMENT MIDDLEWARE: RUNS BEFORE .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });

  // Must include
  next();
});

/** RESPONSIBLE FOR PERFORMING EMBEDDING */
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));

//   // Use Promise.all because the result of all of async await above is a promise
//   // guidesPromises will be with full of Promises => which then run await Promise.all
//   this.guides = await Promise.all(guidesPromises);
// });

// tourSchema.pre('save', function (next) {
//   console.log('Will save document');
//   next();
// });

// // POST SCHEMA
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);

//   next();
// });

// QUERY MIDDLEWARE
// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
  // $ne => Not Equal
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

// QUERY MIDDLEWARE POST -> EVERYTHING THAT START WITH FIND
tourSchema.pre(/^find/, function (next) {
  // This query middleware will run each time when there is a query
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// QUERY MIDDLEWARE - POST
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milleseconds`);
  // console.log(docs);
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  console.log(this);
  next();
});

/** MONGOOSE -PRACTISE MODEL */
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
