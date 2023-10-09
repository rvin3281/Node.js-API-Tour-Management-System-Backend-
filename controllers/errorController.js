// Import the custom Error Class
const AppError = require('./../utils/appError');

// DISPLAY ERROR FOR DEVELOPMENT ENV
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// HANDLE ERROR FOR INVALID INPUT ID
const handleCastErrorDB = (err) => {
  const msg = `Invalid value ${err.value} for field ${err.path}`;
  return new AppError(msg, 400);
};

// HANDLE ERROR FOR DUPLICATE DATABASE FIELD
const handleDuplicateDB = (err) => {
  const value = err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  // console.log(`❤️`, value);
  const msg = `Duplicate field value: ${value}. Please use another field value!`;
  return new AppError(msg, 400);
};

// HANDLE ERROR FOR MONGOOSE VALIDATOR
const handleMongooseValidator = (err) => {
  const msg = `${err.message}`;
  return new AppError(msg, 400);
};

// HANDLE ERROR FOR JWT MANIPULATION DATA
const handleJWTError = () => {
  const msg = `Invalid token. Please try again later`;
  return new AppError(msg, 401);
};

// HANDLE ERROR FOR JWT TOKEN EXPIRY
const handleJWTExpiredError = () => {
  const msg = `Your token has expired! Please login again`;
  return new AppError(msg, 401);
};

// DISPLAY ERROR FOR PRODUCTION
const sendErrorProd = (err, res) => {
  // If isOperation is true : THIS MESSAGE NEED TO DISPLAY TO CLIEND
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // Programming or other unknown error: Dont leak error Details
  } else {
    // 1) Log Error
    console.log('ERROR🔥', err);

    // 2) Send Generic Message
    res.status(err.statusCode).json({
      status: 'error',
      message: 'Program Error: Something went very wrong',
    });
  }
};

module.exports = (err, req, res, next) => {
  // Define the Status Code (400,401,..) object -> If there is no error object then will define as 500 -> Internal Server Error
  err.statusCode = err.statusCode || 500;

  // Define Status Name -> Example the error name which define on the try-catch
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    // Handle Error in Development mode
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // Destruture the err object to create a copy for manipulating
    let error = { ...err, name: err.name, message: err.message };

    //console.log(`🍕 Log Error object after create shallow Copy`, error);

    // 1. Error Handler: CastError -> Identify by error name
    if (error.name === 'CastError') error = handleCastErrorDB(error);

    // 2. Error Handler: Duplicate Database Field error code
    if (error.code === 11000) error = handleDuplicateDB(error);

    // 3. Error Handler: Mongoose Validation Error
    if (error.name === 'ValidationError')
      error = handleMongooseValidator(error);

    // 4. Error Handler: JWT Wrong Payload Data
    if (error.name === 'JsonWebTokenError') error = handleJWTError();

    // 5. Error Handler: Expired Token
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    // console.log(`⭐ Log return error`, error);
    sendErrorProd(error, res);
  }
};
