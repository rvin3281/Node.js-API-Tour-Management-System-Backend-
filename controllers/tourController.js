const Tour = require('../models/tourModel');

const catchAsync = require('./../utils/catchAsync');
// const AppError = require('./../utils/appError');

const factory = require('./handlerFactory');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
};

exports.checkID = (req, res, next, val) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }
  next();
};

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, {
  path: 'reviews',
});

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 }, // Each doc thats go through this pipeline 1 will be added
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    {
      $match: { _id: { $ne: 'EASY' } },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // => TRICK TO TRANSFORM A STRING TO NUMBER

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    // Stage 1
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    // Stage 2
    {
      $group: {
        _id: { $month: '$startDates' }, // Only need the month
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }, //$//push used to generate array if have more than 1 value
      },
    },
    // Stage 3
    {
      $addFields: { _month: '$_id' }, // create a field _month and add the value UD
    },
    // Stage 4
    {
      $project: {
        _id: 0,
      },
    },
    // Stage 5
    {
      $sort: { numTourStarts: -1 },
    },
    // Stage 6
    {
      $limit: 12,
    },
  ]);

  // Send back the result to client
  res.status(200).json({
    status: 'success',
    plan,
  });
});

/** -------------------------------------------------------------------------------------- CREATE MIDDLEWARE TO VALIDATE A DATA BEFORE SIUBMITTING TO SERVER */
// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     // If there is error need to return from this function
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price',
//     });
//   }

//   // Alway include next in the middleware
//   next();
// };

// exports.getTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   //  Tour.findOne({_id:req.params.id})

//   if (!tour) {
//     // This will return immediately and will not move on to next line of code
//     // Create an error instance => pass the error into the next => when next receives it assumes there is an error =>
//     // then it will trigger the global error handling => Global Error handling will send back the response
//     return next(new AppError('No Tour found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: tour,
//     },
//   });
// });

// exports.createTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
// });

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     // This will return immediately and will not move on to next line of code
//     // Create an error instance => pass the error into the next => when next receives it assumes there is an error =>
//     // then it will trigger the global error handling => Global Error handling will send back the response
//     return next(new AppError('No Tour found with that ID', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// });
