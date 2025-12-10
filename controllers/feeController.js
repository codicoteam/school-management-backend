const feeService = require('../services/feeService');
const Fee = require('../models/Fee');
const Student = require('../models/Student');

class FeeController {
  async processPayment(req, res) {
    try {
      const paymentData = req.body;
      const result = await feeService.processPayment(
        paymentData.studentId,
        paymentData
      );
      res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  async getFeeStatement(req, res) {
    try {
      const { studentId } = req.params;
      const statement = await feeService.getStudentFeeStatement(studentId);
      res.status(200).json({
        success: true,
        data: statement
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getAllFees(req, res) {
    try {
      const fees = await Fee.find()
        .populate('student', 'studentId user')
        .populate('student.user', 'firstName lastName');
      
      res.status(200).json({
        success: true,
        count: fees.length,
        data: fees
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getFee(req, res) {
    try {
      const { id } = req.params;
      const fee = await Fee.findById(id)
        .populate('student', 'studentId user')
        .populate('student.user', 'firstName lastName');
      
      if (!fee) {
        return res.status(404).json({
          success: false,
          message: 'Fee record not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: fee
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async createFee(req, res) {
    try {
      const { student, term, academicYear, totalAmount, dueDate } = req.body;
      
      const studentRecord = await Student.findById(student);
      if (!studentRecord) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      const fee = new Fee({
        student,
        term,
        academicYear,
        totalAmount,
        dueDate: dueDate || new Date(Date.now() + 30*24*60*60*1000)
      });

      await fee.save();
      
      res.status(201).json({
        success: true,
        message: 'Fee record created successfully',
        data: fee
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateFee(req, res) {
    try {
      const { id } = req.params;
      const { totalAmount, dueDate } = req.body;
      
      const fee = await Fee.findById(id);
      if (!fee) {
        return res.status(404).json({
          success: false,
          message: 'Fee record not found'
        });
      }

      if (totalAmount) fee.totalAmount = totalAmount;
      if (dueDate) fee.dueDate = dueDate;

      await fee.save();
      
      res.status(200).json({
        success: true,
        message: 'Fee updated successfully',
        data: fee
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteFee(req, res) {
    try {
      const { id } = req.params;
      
      const fee = await Fee.findById(id);
      if (!fee) {
        return res.status(404).json({
          success: false,
          message: 'Fee record not found'
        });
      }

      await fee.deleteOne();
      
      res.status(200).json({
        success: true,
        message: 'Fee deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new FeeController();