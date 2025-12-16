const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '1h' }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '7d' }
  );
  
  return { accessToken, refreshToken };
};

class AuthController {
  // Register new user
  static async register(req, res, next) {
    try {
      const { username, email, password } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email }
      });
      
      if (existingUser) {
        throw new ApiError(409, 'User already exists');
      }
      
      // Create user
      const user = await User.create({
        username,
        email,
        password
      });
      
      // Generate tokens
      const tokens = generateTokens(user.id);
      
      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      logger.info(`New user registered: ${user.email}`);
      
      res.status(201).json({
        success: true,
        data: {
          user: user.getPublicProfile(),
          accessToken: tokens.accessToken
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Login user
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      // Find user
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        throw new ApiError(401, 'Invalid credentials');
      }
      
      // Check password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid credentials');
      }
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();
      
      // Generate tokens
      const tokens = generateTokens(user.id);
      
      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      logger.info(`User logged in: ${user.email}`);
      
      res.json({
        success: true,
        data: {
          user: user.getPublicProfile(),
          accessToken: tokens.accessToken
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Refresh token
  static async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;
      
      if (!refreshToken) {
        throw new ApiError(401, 'Refresh token required');
      }
      
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      
      // Find user
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        throw new ApiError(401, 'User not found');
      }
      
      // Generate new tokens
      const tokens = generateTokens(user.id);
      
      // Set new refresh token
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken
        }
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return next(new ApiError(401, 'Invalid refresh token'));
      }
      next(error);
    }
  }
  
  // Logout user
  static async logout(req, res, next) {
    try {
      // Clear refresh token cookie
      res.clearCookie('refreshToken');
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Get current user profile
  static async getProfile(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });
      
      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Update user profile
  static async updateProfile(req, res, next) {
    try {
      const { username, email } = req.body;
      const user = req.user;
      
      // Check if email already exists (excluding current user)
      if (email && email !== user.email) {
        const existingUser = await User.findOne({
          where: { email },
          attributes: ['id']
        });
        
        if (existingUser) {
          throw new ApiError(409, 'Email already in use');
        }
      }
      
      // Update user
      await user.update({
        username: username || user.username,
        email: email || user.email
      });
      
      res.json({
        success: true,
        data: {
          user: user.getPublicProfile()
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
