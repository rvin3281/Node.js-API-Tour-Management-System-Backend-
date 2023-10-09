const User = require('../models/userModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const factory = require('./handlerFactory');

// implement the function that will take care of filtering the object
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  // Loop through the element
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// MIDDLEWARE TO GET PERSONAL INFORMATION
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;

  next();
};

exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

// Do Not Update password with this!
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);

// User Update their own personal data
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POST password data

  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password update. Please use/updateMyPassword',
      ),
      400,
    );
  }

  // 2) Filter out unwanted field names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

/** DELETE USER */
exports.deleteMe = catchAsync(async (req, res, next) => {
  // GET THE CURRENT LOGGED IN USER
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route not yet defined! Please use/signup instead',
  });
};

// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const user = await User.find();
//   // query.sort().select().skip().limit()

//   /** SEND RESPONSE */
//   res.status(200).json({
//     status: 'success',
//     results: user.length, // Make sense when we sending multiple of object or data
//     data: {
//       user,
//       // tours: tours, => Similar object key value => we can make it into one
//     },
//   });
// });
