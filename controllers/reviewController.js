const mongoose = require('mongoose');
// REQUIR MODEL FILE
const Review = require('../models/reviewModel');
// REQUIRE CATHCASYNC -> Eliminate the repittion of try..catch
const catchAsync = require('./../utils/catchAsync');
// REQUIRE APPERROR -> Custom Error Class for Operational Errors
const AppError = require('./../utils/appError');

const factory = require('./handlerFactory');

exports.getAllReviews = catchAsync(async (req, res, next) => {});

exports.setTourUserId = (req, res, next) => {
  // console.log(req.body);
  // console.log(req.params);
  // console.log(req.user);
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

exports.getAllReviews = factory.getAll(Review);

// ROUTE HANDLER - CREATE REVIEW
exports.createReview = factory.createOne(Review);
exports.getReview = factory.getOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
