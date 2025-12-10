const receptionistService = require('../services/receptionistService');
const feeService = require('../services/feeService');
const Fee = require('../models/Fee');

class ReceptionistController {
  async getStudentInfo(req, res) {
    try {
      const { identifier } = req.params;
      const student = await receptionistService.getStudentInfo(identifier);
      
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: student
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  async searchStudents(req, res) {
    try {
      const { name } = req.query;
      const students = await receptionistService.searchStudents(name);
      res.status(200).json({
        success: true,
        count: students.length,
        data: students
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  async getFeeStatus(req, res) {
    try {
      const { studentId } = req.params;
      const feeStatus = await receptionistService.getStudentFeeStatus(studentId);
      res.status(200).json({
        success: true,
        data: feeStatus
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
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

  async getAllPayments(req, res) {
    try {
      const fees = await Fee.find()
        .populate('student', 'studentId user')
        .populate('student.user', 'firstName lastName');
      
      const allPayments = [];
      fees.forEach(fee => {
        fee.payments.forEach(payment => {
          allPayments.push({
            studentId: fee.student.studentId,
            studentName: fee.student.user ? 
              `${fee.student.user.firstName} ${fee.student.user.lastName}` : 'Unknown',
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
            receiptNumber: payment.receiptNumber,
            paymentDate: payment.paymentDate,
            receivedBy: payment.receivedBy
          });
        });
      });
      
      // Sort by date, newest first
      allPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
      
      res.status(200).json({
        success: true,
        count: allPayments.length,
        data: allPayments
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new ReceptionistController();