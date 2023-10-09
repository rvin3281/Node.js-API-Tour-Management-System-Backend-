const Tour = require('../models/tourModel');

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

exports.getAllTours = async (req, res) => {
  try {
    // console.log(req.query);
    /** 1A) BASIC FILTERING */
    // 1.1 Create a shallow copy for req.query => Always dont mutate original obj or array
    const queryObj = { ...req.query };

    // 1.2 Get the excluding fields in array
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    // 1.3 USing forEach remove any field name consist of above
    excludeFields.forEach((el) => delete queryObj[el]);

    // 1.4 Find for Object without the core features -> page, sort
    // - Tour.find(queryObj) line doesn't execute the query immediately.
    // - creates a query object with the specified criteria (defined by queryObj)
    // - database query itself isn't executed until you explicitly request it
    // -  typically by awaiting or calling a method like .exec() on the query object
    // const query = Tour.find(queryObj);

    /** 1B). ADVANCED FILTERING */
    // Example How Object Lookalike -> {difficulty: 'easy', duration: {$gte:5}}

    // 2.1 Convert the Object to String
    let queryStr = JSON.stringify(queryObj);
    // 2.2 Use the query string to replace the query string -> gte and some other operator
    // Replacing -> gte, gt, lte, lt
    // 2.3. Match one of the four words and then replace it with the same words with $
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    // we only want to match if it is this exact word, without any other string around it.
    // g flag here happen multiple times. if we have  all of them, then it will replace all.

    // Convert Back to JS object
    let query = Tour.find(JSON.parse(queryStr));
    console.log(query);

    /** 2) Sorting */
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' '); // Split the fields into an array
      console.log(sortBy);
      query = query.sort(sortBy); // Join the fields with a space to sort by multiple fields
    } else {
      query = query.sort('-createdAt');
    }

    // 3) Field Limiting
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      // console.log(fields);
      query = query.select(fields);
    } else {
      query = query.select('-__v'); // -> Here we excluding on this fields if there is no fields select
    }

    // 4) Pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const numTours = await Tour.countDocuments();
      if (skip >= numTours) throw new Error('This page does not exist');
    }

    // Execute the query
    // - At this point, the query is executed, and the result is stored in the tours variable.
    const tours = await query;
    // query.sort().select().skip().limit()

    /** SEND RESPONSE */
    res.status(200).json({
      status: 'success',
      results: tours.length, // Make sense when we sending multiple of object or data
      data: {
        tours,
        // tours: tours, => Similar object key value => we can make it into one
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    //  Tour.findOne({_id:req.params.id})
    res.status(200).json({
      status: 'success',
      data: {
        tour: tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: 'Invalid data sent',
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    // findByIdAndUpdate() -> Provide ID, DATA and Options
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      // New Updated document is the one will returned
      // Since we want send back the updated document to client => Always need this method
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};
