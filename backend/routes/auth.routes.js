console.log('✅ auth.routes.js loaded');

const { Router } = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/auth.controller');

const router = Router();

console.log('📝 Registering auth routes...');

// Signup route
router.post(
  '/signup',
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),

    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email'),

    body('phone')
      .trim()
      .notEmpty().withMessage('Phone is required'),

    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  ],
  AuthController.signup
);

// Login route
router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty()
  ],
  AuthController.login
);

// Get current user
router.get('/me', AuthController.getCurrentUser);

// Debug: List all registered routes
console.log('✅ Auth routes registered:');
console.log('   POST /signup');
console.log('   POST /login');
console.log('   GET /me');
router.post('/auth/signup', AuthController.signup);
module.exports = router;
