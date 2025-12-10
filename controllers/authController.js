const authService = require('../services/authService');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

class AuthController {
  async register(req, res) {
    try {
      const result = await authService.register(req.body);
      const token = generateToken(result.user.id);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: result.user,
        roleRecord: result.roleRecord
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      const token = generateToken(result.user.id);
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: result.user,
        roleInfo: result.roleInfo
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  async getMe(req, res) {
    try {
      const user = await User.findById(req.user.id).select('-password');
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getAllUsers(req, res) {
    try {
      const users = await User.find().select('-password');
      res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new AuthController();