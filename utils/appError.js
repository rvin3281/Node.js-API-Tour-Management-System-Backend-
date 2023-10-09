class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // Super used to call the parent constructor

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'; // If status code start with 4 -> Then we have a fail

    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Export the AppError Class
module.exports = AppError;
