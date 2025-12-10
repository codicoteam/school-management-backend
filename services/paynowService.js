const PayNowTransaction = require('../models/PayNowTransaction');
const Fee = require('../models/Fee');
const Student = require('../models/Student');
const paynowConfig = require('../config/paynow');

class PayNowService {
  /**
   * Initiate PayNow payment for student fees
   * @param {String} studentId - Student ID
   * @param {Object} paymentData - Payment data
   * @returns {Object} Payment initiation response
   */
  async initiatePayment(studentId, paymentData) {
    try {
      const { term, academicYear, amount } = paymentData;
      
      // Get student details
      const student = await Student.findById(studentId)
        .populate('user', 'email firstName lastName');
      
      if (!student || !student.user) {
        throw new Error('Student not found');
      }

      // Check if student has existing fee record
      let fee = await Fee.findOne({
        student: studentId,
        term: term,
        academicYear: academicYear
      });

      if (!fee) {
        // Create new fee record if doesn't exist
        fee = new Fee({
          student: studentId,
          term: term,
          academicYear: academicYear,
          totalAmount: amount,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        await fee.save();
      }

      // Create PayNow payment
      const feeData = {
        term: term,
        academicYear: academicYear,
        amount: amount
      };

      const studentData = {
        studentId: student.studentId,
        email: student.user.email,
        name: `${student.user.firstName} ${student.user.lastName}`
      };

      const paynowResponse = await paynowConfig.createPayment(feeData, studentData);

      // Save transaction record
      const transaction = new PayNowTransaction({
        student: studentId,
        fee: fee._id,
        reference: paynowResponse.reference,
        amount: amount,
        term: term,
        academicYear: academicYear,
        redirectUrl: paynowResponse.redirectUrl,
        pollUrl: paynowResponse.pollUrl,
        studentEmail: student.user.email,
        studentName: studentData.name,
        studentId: student.studentId,
        status: 'pending'
      });

      await transaction.save();

      return {
        success: true,
        message: 'Payment initiated successfully',
        data: {
          transactionId: transaction._id,
          reference: transaction.reference,
          redirectUrl: paynowResponse.redirectUrl,
          pollUrl: paynowResponse.pollUrl,
          instructions: paynowResponse.instructions,
          amount: amount,
          student: {
            name: studentData.name,
            studentId: student.studentId,
            email: student.user.email
          },
          feeDetails: {
            term: term,
            academicYear: academicYear,
            amount: amount
          }
        }
      };
    } catch (error) {
      console.error('PayNow initiation error:', error);
      throw new Error(`Payment initiation failed: ${error.message}`);
    }
  }

  /**
   * Check payment status
   * @param {String} reference - Transaction reference
   * @returns {Object} Payment status
   */
  async checkPaymentStatus(reference) {
    try {
      const transaction = await PayNowTransaction.findOne({ reference });
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (!transaction.pollUrl) {
        throw new Error('Poll URL not available for this transaction');
      }

      // Check status from PayNow
      const status = await paynowConfig.checkPaymentStatus(transaction.pollUrl);

      // Update transaction status
      transaction.status = status.paid ? 'paid' : 
                         status.status === 'cancelled' ? 'cancelled' :
                         status.status === 'failed' ? 'failed' : 'pending';
      
      if (status.paid) {
        transaction.paynowReference = status.paynowReference;
        transaction.paymentMethod = status.paymentMethod;
        transaction.paymentDate = new Date();
        
        // Update fee record
        const fee = await Fee.findById(transaction.fee);
        if (fee) {
          fee.payments.push({
            amount: transaction.amount,
            paymentDate: new Date(),
            paymentMethod: 'paynow',
            receiptNumber: status.paynowReference,
            receivedBy: transaction.student,
            notes: `Paid via PayNow - Reference: ${status.paynowReference}`
          });
          
          fee.paidAmount += transaction.amount;
          await fee.save();
        }
      }

      await transaction.save();

      return {
        success: true,
        data: {
          reference: transaction.reference,
          status: transaction.status,
          amount: transaction.amount,
          studentId: transaction.studentId,
          studentName: transaction.studentName,
          paynowReference: transaction.paynowReference,
          paymentMethod: transaction.paymentMethod,
          paymentDate: transaction.paymentDate,
          feeUpdated: status.paid
        }
      };
    } catch (error) {
      console.error('PayNow status check error:', error);
      throw new Error(`Status check failed: ${error.message}`);
    }
  }

  /**
   * Handle PayNow webhook (result URL callback)
   * @param {Object} webhookData - Webhook data from PayNow
   * @returns {Object} Webhook processing result
   */
  async handleWebhook(webhookData) {
    try {
      const { reference, paynowreference, status, amount, method } = webhookData;
      
      const transaction = await PayNowTransaction.findOne({ reference });
      
      if (!transaction) {
        console.warn(`Webhook received for unknown transaction: ${reference}`);
        return { success: false, message: 'Transaction not found' };
      }

      // Update transaction
      transaction.paynowReference = paynowreference;
      transaction.paymentMethod = method;
      transaction.status = status.toLowerCase();
      
      if (status.toLowerCase() === 'paid') {
        transaction.paymentDate = new Date();
        
        // Update fee record
        const fee = await Fee.findById(transaction.fee);
        if (fee) {
          fee.payments.push({
            amount: amount,
            paymentDate: new Date(),
            paymentMethod: 'paynow',
            receiptNumber: paynowreference,
            receivedBy: transaction.student,
            notes: `Paid via PayNow Webhook - Reference: ${paynowreference}`
          });
          
          fee.paidAmount += amount;
          await fee.save();
        }
      }

      await transaction.save();

      console.log(`Webhook processed for transaction ${reference}, status: ${status}`);
      
      return {
        success: true,
        message: 'Webhook processed successfully',
        reference: reference,
        status: status
      };
    } catch (error) {
      console.error('Webhook processing error:', error);
      throw new Error(`Webhook processing failed: ${error.message}`);
    }
  }

  /**
   * Get transaction history for a student
   * @param {String} studentId - Student ID
   * @returns {Array} Transaction history
   */
  async getStudentTransactions(studentId) {
    try {
      const transactions = await PayNowTransaction.find({ student: studentId })
        .sort({ createdAt: -1 });
      
      return {
        success: true,
        count: transactions.length,
        data: transactions
      };
    } catch (error) {
      console.error('Get transactions error:', error);
      throw new Error(`Failed to get transactions: ${error.message}`);
    }
  }

  /**
   * Cancel a pending transaction
   * @param {String} reference - Transaction reference
   * @returns {Object} Cancellation result
   */
  async cancelTransaction(reference) {
    try {
      const transaction = await PayNowTransaction.findOne({ reference });
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'pending') {
        throw new Error(`Cannot cancel transaction with status: ${transaction.status}`);
      }

      transaction.status = 'cancelled';
      await transaction.save();

      return {
        success: true,
        message: 'Transaction cancelled successfully',
        reference: reference
      };
    } catch (error) {
      console.error('Transaction cancellation error:', error);
      throw new Error(`Cancellation failed: ${error.message}`);
    }
  }
}

module.exports = new PayNowService();