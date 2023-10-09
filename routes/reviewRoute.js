const express = require('express');

// REQUIE REVIEW CONTROLLER FIlE -> ROUTE HANDLER FUNCTION FILE
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

// POST /tour/123123/reviews
// GET /tour/tour_id/reviews
// GET /tour/tour_id/reviews/review_id

// Using router.use, and authcontroller.protect will basically protect all the routes that come after this point.
router.use(authController.protect);

// Post used to create new data
router
  .route('/')
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserId,
    reviewController.createReview,
  )
  .get(reviewController.getAllReviews);

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview,
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview,
  );

module.exports = router;
