const adminService = require('../services/adminService');
const FeeStructure = require('../models/FeeStructure');
const User = require('../models/User');

class AdminController {
  async getStatistics(req, res) {
    try {
      const stats = await adminService.getSchoolStatistics();
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  async updateFeeStructure(req, res) {
    try {
      const feeStructure = await adminService.updateFeeStructure(req.body);
      res.status(200).json({
        success: true,
        message: 'Fee structure updated successfully',
        data: feeStructure
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  async getClassFeeStructure(req, res) {
    try {
      const { grade, academicYear } = req.params;
      const feeStructure = await adminService.getClassFeeStructure(grade, academicYear);
      res.status(200).json({
        success: true,
        data: feeStructure
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getAllFeeStructures(req, res) {
    try {
      const feeStructures = await FeeStructure.find();
      
      res.status(200).json({
        success: true,
        count: feeStructures.length,
        data: feeStructures
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteFeeStructure(req, res) {
    try {
      const { id } = req.params;
      
      const feeStructure = await FeeStructure.findById(id);
      if (!feeStructure) {
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found'
        });
      }

      await feeStructure.deleteOne();
      
      res.status(200).json({
        success: true,
        message: 'Fee structure deleted successfully'
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

module.exports = new AdminController();