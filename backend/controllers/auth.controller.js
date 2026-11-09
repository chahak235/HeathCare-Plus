const User = require('./models/User');
const { body, validationResult } = require('express-validator');

class AuthController {
  // Validation rules for signup
  static signupValidation = [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please enter a valid email address')
      .normalizeEmail(),
    
    body('phone')
      .trim()
      .notEmpty().withMessage('Phone number is required')
      .matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Please enter a valid phone number'),
    
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
  ];

  // Sign up user
  static async signup(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation failed',
          errors: errors.array() 
        });
      }

      const { name, email, phone, password } = req.body;

      // Create new user
      const user = await User.create({ name, email, phone, password });

      // Generate token
      const token = User.generateToken(user);

      // Log successful signup (without password)
      console.log(`✅ New user registered: ${email} (ID: ${user.id})`);

      // Return success response
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          is_verified: user.is_verified
        }
      });

    } catch (error) {
      console.error('❌ Signup error:', error.message);
      
      // Handle specific errors
      let statusCode = 500;
      let errorMessage = 'Server error';
      
      if (error.message === 'Email already registered') {
        statusCode = 400;
        errorMessage = error.message;
      } else if (error.message.includes('validation')) {
        statusCode = 400;
        errorMessage = error.message;
      }

      res.status(statusCode).json({ 
        success: false, 
        message: errorMessage
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      // Check validation errors from express-validator
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation failed',
          errors: errors.array() 
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        console.log(`❌ Login failed: User not found for email ${email}`);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      // Check if user is verified (skip in development mode)
      const isDevelopment = process.env.NODE_ENV !== 'production';
      if (!user.is_verified && !isDevelopment) {
        console.log(`❌ Login failed: User ${email} not verified`);
        return res.status(403).json({ 
          success: false, 
          message: 'Please verify your email address before logging in' 
        });
      }

      // Verify password
      const isValidPassword = await User.verifyPassword(password, user.password);
      if (!isValidPassword) {
        console.log(`❌ Login failed: Invalid password for email ${email}`);
        console.log(`   Password length: ${password.length}, Hash length: ${user.password?.length || 0}`);
        console.log(`   Hash starts with: ${user.password?.substring(0, 10) || 'N/A'}`);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      console.log(`✅ Login successful for user: ${email} (ID: ${user.id})`);

      // Generate token
      const token = User.generateToken(user);

      // Update last login (optional)
      // await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

      // Return success response
      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          is_verified: user.is_verified
        }
      });

    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }

  // Get current user
  static async getCurrentUser(req, res) {
    try {
      const user = await User.getUserWithProfile(req.user.id);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      res.json({
        success: true,
        user
      });

    } catch (error) {
      console.error('❌ Get user error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const profileData = req.body;

      const updatedUser = await User.updateProfile(userId, profileData);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser
      });

    } catch (error) {
      console.error('❌ Update profile error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update profile' 
      });
    }
  }
}

module.exports = AuthController;