const mongoose = require('mongoose');
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
// Import Email Controller
const sendEmail = require('./../utils/email');

// Create a JWT (JSON Web Token) with the user's ID, using the JWT_SECRET from environment variables,
// and set an expiration time specified by JWT_EXPIRES_IN also from environment variables.
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendtoken = (user, statusCode, res) => {
  // This token can be used for user authentication and authorization.
  // The generated token is sent in the response for user authentication and authorization.
  const token = signToken(user._id);

  const cookieOptions = {
    // Set similar like the one set for JSON web token
    // Convert the day in milliseconds
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    // the cookie will only be sent on an encrypted connection => only using HTTPS
    //secure: true,
    // this will make cookie cannot be accessed or modified in any way by the browser
    // Important to prevent those Cross-Site scripting attacks

    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // REMOVE THE PASSWORD FROM OUTPUT
  user.password = undefined;

  // Send a success response with the token and user data
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    // Create a new user based on the request data
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    passwordResetToken: req.body.passwordResetToken,
    passwordResetExpire: req.body.passwordResetExpire,
  });

  createSendtoken(newUser, 201, res);

  // // This token can be used for user authentication and authorization.
  // // The generated token is sent in the response for user authentication and authorization.
  // const token = signToken(newUser._id);

  // // Send a success response with the token and user data
  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });
});

exports.login = catchAsync(async (req, res, next) => {
  // Read the email and password from the body
  const { email, password } = req.body;
  // const email = req.body.email;
  // const password = req.body.password;

  // 1) Check if email and password exist
  if (!email || !password) {
    // Use the Custom Error Class
    // Use return because after calling the next middleware => make sure the login function finishes right away
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) check if user exists with given email && password is correct
  //  - Explicitly select the password => Use "+" because this by default not select
  const user = await User.findOne({
    ...mongoose.sanitizeFilter({ email }),
  }).select('+password');

  //                        3) Check if the inputted password and password in database is matched
  //                            Compare Password -> Async function
  if (!user || !(await user.comparePasswordInDB(password, user.password))) {
    // throw error
    return next(new AppError('Incorrect Email or Password', 400));
  }

  createSendtoken(user, 200, res);

  // // 3) if everything is okay => send token to client
  // const token = signToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of its there
  //    - Get the header authorization and if the auth start with Bearer
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Using split with space => we get an array of [Bearer] and [auth]
    // Get the 2nd element => because the 2nd elements holds the authorization
    token = req.headers.authorization.split(' ')[1];
  }
  // console.log(token);

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401),
    );
  }

  // 2) Verification the token => Super Important => Using jwt.verify() jwt method
  //    - 3rd argument will be the callback
  //    - Handle this error globally
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //console.log(decoded);

  // 3) If verificatio successful -> Check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist',
        401,
      ),
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again', 401),
    );
  }

  // Store the information of currently logged in user
  req.user = currentUser;

  /** GRANT ACCESS TO PROTECTED ROUTE */
  // If above all passed then only the next() function will be executed
  next();
});

// MIDDLEWARE TO RESTRICT ACCESS FOR DELETING ROUTES
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array => ['admin', 'lead-guide']
    // if role='user', since not contain in array, => user NO permission

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
};

// MIDDLEWARE FOR PASSWORD RESET (1st Part) - ONLY RECEIVED EMAIL ADDRESS
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get User based on POSTED email
  const user = await User.findOne({ email: req.body.email });
  // 1.1) Verify user exist
  if (!user) {
    return next(new AppError('Email not found', 404));
  }

  // 2) Generate the random reset token - USER EXIST
  // Instance methods in Mongoose are useful when you need to perform operations or calculations related to a specific document
  // defined on the model's schema and can be called on individual documents
  const resetToken = user.createPasswordResetToken();

  // Because we have mandotory field in schema -> This will deactivate all the validator that describe in schema
  await user.save({ validateBeforeSave: false });

  // 3) Send email to user's email -> this will form http://www.example.com/api/
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forget Your Password? Submit a PATCH request with your new password
ans passwordConfirm to: ${resetURL}.\nIf you didn't forget. Please ignore this`;

  // console.log(message);

  // Trigger the email
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your Password reset token (valid for 10min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later'),
      500,
    );
  }
});

// MIDDLEWARE FOR PASSWORD RESET (2nd Part) - RECEIVED THE TOKEN AND NEW PASSWORD
exports.resetPassword = catchAsync(async (req, res, next) => {
  /** 1) Get User based on the token  */
  // Encrypt the reset token to compare
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // Identify the user based on the token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    // Check passwordExpiryDate is greater than right now -> if the expires date greater than now -> means its in future and hasnt expired
    passwordResetExpire: { $gt: Date.now() },
  });

  /** 2) If token has not expired and there is user, set the new password */
  if (!user) {
    next(new AppError('Token is invalid or expired'), 400);
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;

  await user.save();

  // 3) Update changedPasswordAt property for the user

  // 4) Log the user in, send JWT
  createSendtoken(user, 200, res);
  // const token = signToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

/** MIDDLEWARE TO UPDATE PASSWORD - ONLY FOR LOGGED IN USER */
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if Posted current password is correct
  if (
    !(await user.comparePasswordInDB(req.body.currentPassword, user.password))
  ) {
    return next(new AppError('Current Password is Incorrect'));
  }

  //2.1) Check if the the current password ===  new password
  if (req.body.currentPassword === req.body.newPassword) {
    return next(new AppError('New password cannot be same as old password '));
  }

  // 3) If the password is correct then update the password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;

  // Using pre.save on userModel -> the passwordChangedDate will be updated
  // When user try to access again -> then the protect route will verify for the changesPasswordAfter
  await user.save();

  // 4) Log user in, send JWT
  createSendtoken(user, 200, res);
  // const token = signToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});
