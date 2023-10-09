const express = require('express');

// Import handler function for Rotes
const userController = require('./../controllers/userController');

const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
// RESET PASSWORD
router.post('/forgotPassword', authController.forgotPassword);

// RESET PASSWORD PATCH WITH PARAMETER
router.patch('/resetPassword/:token', authController.resetPassword);

// Using router.use, and authcontroller.protect will basically protect all the routes that come after this point.
router.use(authController.protect);

/** ALWAYS MUST BE AUTHENTICATED */
router.patch('/updatePassword', authController.updatePassword);

router.get('/me', userController.getMe, userController.getUser);

router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

// ONLY ALLOW ADMIN TO PERFORM THE BELOW ACTION

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
