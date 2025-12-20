const paynowService = require('../services/paynowService');
const { protect, authorize } = require('../middlewares/auth');
const PayNowTransaction = require('../models/PayNowTransaction');

class PayNowController {
  /**
   * Initiate PayNow payment
   */
  async initiatePayment(req, res) {
    try {
      const { studentId, term, academicYear, amount } = req.body;
      const userId = req.user.id;

      // Check if user is authorized (student paying for themselves or admin/receptionist)
      if (req.user.role === 'student') {
        // Student can only pay for themselves
        const student = await Student.findOne({ user: userId });
        if (!student || student._id.toString() !== studentId) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to initiate payment for this student'
          });
        }
      }

      const result = await paynowService.initiatePayment(studentId, {
        term,
        academicYear,
        amount
      });

      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Check payment status
   */
  async checkStatus(req, res) {
    try {
      const { reference } = req.params;
      
      const result = await paynowService.checkPaymentStatus(reference);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Handle PayNow webhook (public endpoint, no auth required)
   */
  async handleWebhook(req, res) {
    try {
      const result = await paynowService.handleWebhook(req.body);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get student's PayNow transactions
   */
  async getStudentTransactions(req, res) {
    try {
      const { studentId } = req.params;
      const userId = req.user.id;

      // Authorization check
      if (req.user.role === 'student') {
        const student = await Student.findOne({ user: userId });
        if (!student || student._id.toString() !== studentId) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to view these transactions'
          });
        }
      }

      const result = await paynowService.getStudentTransactions(studentId);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Cancel pending transaction
   */
  async cancelTransaction(req, res) {
    try {
      const { reference } = req.params;
      
      const result = await paynowService.cancelTransaction(reference);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get all PayNow transactions (admin only)
   */
  async getAllTransactions(req, res) {
    try {
      const transactions = await PayNowTransaction.find()
        .populate('student', 'studentId user')
        .populate('student.user', 'firstName lastName')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        count: transactions.length,
        data: transactions
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new PayNowController();