/**------------------------------------------------------------------------------- ## INITIALIZE VARIABLE */
const express = require('express'); // Initializing the express variable by requiring the Express.js framework.

const morgan = require('morgan'); //Initializing the morgan variable by requiring the Morgan middleware -  commonly used for logging HTTP requests.

const rateLimit = require('express-rate-limit'); // Require the express rate limit package

const helmet = require('helmet'); // Require 3rd party package helmet

const mongoSanitize = require('express-mongo-sanitize'); // NO SQL QUERY INJECTION

const xss = require('xss-clean');

const hpp = require('hpp');

const AppError = require('./utils/appError'); // Import Custom Error Class

const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes'); // Initializing tourRouter - by requiring custom route modules (tourRoutes) by requiring custom route modules of application

const userRouter = require('./routes/userRoutes'); // Initializing userRouter - by requiring custom route modules (userRoutes) by requiring custom route modules of application

const reviewRouter = require('./routes/reviewRoute'); // Initializing userRouter - by requiring custom route modules (userRoutes) by requiring custom route modules of application

const app = express(); // Initializing the app variable as an instance of the Express.js application -> use to configure and define routes for your API.

/**------------------------------------------------------------------------------- ## 1) GLOBAL MIDDLEWARE */

// Helmet Middleware - SET SECURITY HTTP HEADER
app.use(helmet());

// DEVELOPMENT LOGGING
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limit Middleware - LIMIT REQUEST FROM SAME API
const limiter = rateLimit({
  // define how many request per IP we are going to allow in certain amount of time
  max: 100,
  // Allow 100 request from the same IP in 1 hour
  windowMs: 60 * 60 * 1000,
  // Error Message
  message: 'Too many request from this IP, please try again in an hour',
});

app.use('/api', limiter);

// Your server, which is built using Express.js, is configured
// to handle JSON request bodies using middleware such as express.json().
// BODY PARSER -> READING DATA FROM THE BODY INTO REQ.BODY
app.use(express.json({ limit: '10kb' }));

// Data Sanitization agains NoSQL query Injection
app.use(mongoSanitize());

// Data Sanitization against XSS (Cross Site Scripting Attack)
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// Serve Static File
app.use(express.static(`${__dirname}/public`));

/* -- NO NEED THIS MIDDLEWARE - LATER CAN REMOVE
app.use((req, res, next) => {
  console.log('Hellow from the middleware');
  // If never call next -> the req and res will stuck here -> cannot move on
  next();
});
*/

// SERVING STATIC FILES -> TEST MIDDLEWARE
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

/**------------------------------------------------------------------------------- ## 3) ROUTES */

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  /** CAN REMOVE THE COMMENTED LINE -> REFACTORED BY CREATING A CUSTOM ERROR CLASS */
  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;

  // USE THE CUSTOM APP ERROR CLASS
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Error Handling Middleware -> Based on the four arguments -> EXPRESS knows this is an error handling Middleware
app.use(globalErrorHandler);

module.exports = app;

// app.get('/', (req, res) => {
//   res
//     .status(200)
//     .json({ message: 'Hello from the server side!', app: 'Natours' });
// });

// app.post('/', (req, res) => {
//   res.send('You can post to this endpoint');
// });

/**---------------------------------------------------------------------------------------------------------------- ##  ROUTE HANDLERS FOR ROUTE 1 */
/** JSON.parse will conver to an array of Javascript object */
/** READ THE JSON FILE AND JSON.PARSE WILL CONVER THE JSON PLAIN FILE TO JAVASCRIPT ARRAY OF OBJECT */
/** USER ONLY CAN UNDERSTAND JAVASCRIPT ARRAY OF OBJECT */

/** #GET REQUEST */
// app.get('/api/v1/tours', getAllTours);

/** #POST REQUEST */
// app.post('/api/v1/tours', createTour);

/** #GET SINGLE DATA */
// app.get('/api/v1/tours/:id', getTour);

/** #PATCH REQUEST */
// app.patch('/api/v1/tours/:id', updateTour);

/** #DELETE REQUEST */
// app.delete('/api/v1/tours/:id', deleteTour);
