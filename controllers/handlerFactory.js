const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      // This will return immediately and will not move on to next line of code
      // Create an error instance => pass the error into the next => when next receives it assumes there is an error =>
      // then it will trigger the global error handling => Global Error handling will send back the response
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // findByIdAndUpdate() -> Provide ID, DATA and Options
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      // New Updated document is the one will returned
      // Since we want send back the updated document to client => Always need this method
      runValidators: true, // RUN THE VALIDATION AGAIN WHEN UPDATE THE DOCUMENT
    });

    if (!doc) {
      // This will return immediately and will not move on to next line of code
      // Create an error instance => pass the error into the next => when next receives it assumes there is an error =>
      // then it will trigger the global error handling => Global Error handling will send back the response
      return next(new AppError('No documnt found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

// READ SINGLE DATA BASED ON ID
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    /*------------------ SPECIAL CASE - POPULATE -----------------
    we will first create the query, and then, if there is the populate options object,
    we will then add that to the query, and then by the end, await that query
    */

    let query = Model.findById(req.params.id);

    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
      // This will return immediately and will not move on to next line of code
      // Create an error instance => pass the error into the next => when next receives it assumes there is an error =>
      // then it will trigger the global error handling => Global Error handling will send back the response
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

// READ ALL DATA FROM A COLLECTION
exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tour (hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // Execute the query
    // - At this point, the query is executed, and the result is stored in the tours variable.
    const doc = await features.query;
    // query.sort().select().skip().limit()

    /** SEND RESPONSE */
    res.status(200).json({
      status: 'success',
      results: doc.length, // Make sense when we sending multiple of object or data
      data: {
        doc,
        // tours: tours, => Similar object key value => we can make it into one
      },
    });
  });
