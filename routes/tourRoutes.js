const express = require('express');

// Import handler function for Rotes
const tourController = require('./../controllers/tourController');

// Import auth controller module
const authController = require('./../controllers/authController');

const reviewRouter = require('./../routes/reviewRoute');

const router = express.Router();

// POST /tour/123123/reviews
// GET /tour/tour_id/reviews
// GET /tour/tour_id/reviews/review_id

// For this specific route => we going to use the reviewRouter instead
router.use('/:tourId/reviews', reviewRouter);

// router.param('id', tourController.checkID);

// Create a checkbody middleware
// Check if contains the name and price property
// If not, send back 400 (bad request)
// Add it to the post handler stack

// Create Special Route
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );

// the actions of creating or editing tours,
// we only want to allow lead guides and administrators to perform these actions.
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

router.route('/:tourId/reviews');

module.exports = router;
