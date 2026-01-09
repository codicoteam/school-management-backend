const PayNowTransaction = require('../models/PayNowTransaction');
const Fee = require('../models/Fee');
const Student = require('../models/Student');
const paynowConfig = require('../config/paynow');
const mongoose = require('mongoose');

class PayNowService {
  /**
   * Find student by either MongoDB _id or studentId string
   * @param {String} identifier - Either MongoDB ObjectId or studentId string
   * @returns {Object} Student document with populated user
   */
  async findStudentByIdentifier(identifier) {
    try {
      console.log('🔍 [findStudentByIdentifier] Looking for student with identifier:', identifier);
      
      // First try: Check if identifier is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(identifier)) {
        console.log('   📍 Identifier appears to be a MongoDB ObjectId');
        const student = await Student.findById(identifier)
          .populate('user', 'email firstName lastName username');
        
        if (student) {
          console.log('   ✅ Found student by MongoDB _id:', student._id);
          console.log('      Student ID:', student.studentId || 'Not set');
          console.log('      Student Name:', student.user ? `${student.user.firstName} ${student.user.lastName}` : 'No name');
          return student;
        }
        console.log('   ❌ No student found with MongoDB _id:', identifier);
      }
      
      // Second try: Search by studentId string
      console.log('   🔄 Trying to find student by studentId string:', identifier);
      const student = await Student.findOne({ studentId: identifier })
        .populate('user', 'email firstName lastName username');
      
      if (student) {
        console.log('   ✅ Found student by studentId string:', identifier);
        console.log('      MongoDB _id:', student._id);
        console.log('      Student Name:', student.user ? `${student.user.firstName} ${student.user.lastName}` : 'No name');
        return student;
      }
      
      console.log('   ❌ No student found with studentId string:', identifier);
      return null;
      
    } catch (error) {
      console.error('💥 [findStudentByIdentifier] Error:', error.message);
      console.error('   Stack:', error.stack);
      throw error;
    }
  }

  /**
   * Initiate PayNow payment for student fees
   * @param {String} studentIdentifier - Student ID (MongoDB _id or studentId string)
   * @param {Object} paymentData - Payment data
   * @returns {Object} Payment initiation response
   */
  async initiatePayment(studentIdentifier, paymentData) {
    const startTime = Date.now();
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`\n🚀 [initiatePayment] START - Transaction ID: ${transactionId}`);
    console.log('   📋 Request Details:');
    console.log('      Student Identifier:', studentIdentifier);
    console.log('      Payment Data:', JSON.stringify(paymentData, null, 2));
    console.log('      Timestamp:', new Date().toISOString());
    
    try {
      const { term, academicYear, amount } = paymentData;
      
      // Validate required fields
      if (!term || !academicYear || !amount) {
        throw new Error(`Missing required fields. Required: term, academicYear, amount. Received: ${JSON.stringify({ term, academicYear, amount })}`);
      }
      
      if (typeof amount !== 'number' || amount <= 0) {
        throw new Error(`Invalid amount: ${amount}. Amount must be a positive number.`);
      }
      
      console.log('🔍 [initiatePayment] Step 1: Looking up student...');
      
      // Get student details using flexible identifier
      const student = await this.findStudentByIdentifier(studentIdentifier);
      
      if (!student) {
        throw new Error(`Student not found with identifier: "${studentIdentifier}". Please check if the student exists.`);
      }
      
      if (!student.user) {
        throw new Error(`Student found (${student._id}) but not linked to a User account.`);
      }
      
      console.log('✅ [initiatePayment] Student found successfully');
      console.log('   Student Details:', {
        _id: student._id,
        studentId: student.studentId,
        name: student.user ? `${student.user.firstName} ${student.user.lastName}` : 'Unknown',
        email: student.user ? student.user.email : 'No email'
      });

      console.log('🔍 [initiatePayment] Step 2: Checking/Creating fee record...');
      
      // Check if student has existing fee record
      let fee = await Fee.findOne({
        student: student._id,
        term: term,
        academicYear: academicYear
      });

      if (!fee) {
        console.log('   📝 Creating new fee record...');
        fee = new Fee({
          student: student._id,
          term: term,
          academicYear: academicYear,
          totalAmount: amount,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        await fee.save();
        console.log('   ✅ New fee record created:', fee._id);
      } else {
        console.log('   ✅ Existing fee record found:', fee._id);
        console.log('      Current balance:', fee.balance);
        console.log('      Current status:', fee.status);
      }

      console.log('🔍 [initiatePayment] Step 3: Creating PayNow payment...');
      
      // Create PayNow payment data
      const feeData = {
        term: term,
        academicYear: academicYear,
        amount: amount
      };

      const studentData = {
        studentId: student.studentId || student._id.toString(),
        email: student.user.email,
        name: `${student.user.firstName} ${student.user.lastName}`,
        username: student.user.username
      };

      console.log('   📤 Sending to PayNow API...');
      console.log('      Fee Data:', feeData);
      console.log('      Student Data:', { ...studentData, email: '***masked***' });
      
      const paynowResponse = await paynowConfig.createPayment(feeData, studentData);
      
      console.log('✅ [initiatePayment] PayNow API response received');
      console.log('   PayNow Success:', paynowResponse.success);
      console.log('   Reference:', paynowResponse.reference);
      console.log('   Redirect URL:', paynowResponse.redirectUrl ? 'Present' : 'Missing');
      console.log('   Poll URL:', paynowResponse.pollUrl ? 'Present' : 'Missing');
      
      if (!paynowResponse.success) {
        throw new Error(`PayNow API failed: ${paynowResponse.error || 'Unknown error'}`);
      }

      console.log('🔍 [initiatePayment] Step 4: Saving transaction record...');
      
      // Save transaction record
      const transaction = new PayNowTransaction({
        student: student._id,
        fee: fee._id,
        reference: paynowResponse.reference,
        amount: amount,
        term: term,
        academicYear: academicYear,
        redirectUrl: paynowResponse.redirectUrl,
        pollUrl: paynowResponse.pollUrl,
        studentEmail: student.user.email,
        studentName: studentData.name,
        studentId: student.studentId || student._id.toString(),
        status: 'pending',
        metadata: {
          transactionId: transactionId,
          identifierUsed: studentIdentifier,
          identifierType: mongoose.Types.ObjectId.isValid(studentIdentifier) ? 'mongodb_id' : 'studentId_string'
        }
      });

      await transaction.save();
      
      console.log('✅ [initiatePayment] Transaction saved:', transaction._id);
      
      const result = {
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
            studentId: student.studentId || student._id.toString(),
            email: student.user.email,
            mongoId: student._id
          },
          feeDetails: {
            term: term,
            academicYear: academicYear,
            amount: amount,
            feeId: fee._id
          }
        }
      };
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ [initiatePayment] COMPLETE - Duration: ${duration}ms`);
      console.log('   Result:', {
        success: result.success,
        transactionId: result.data.transactionId,
        reference: result.data.reference
      });
      
      return result;
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.error(`💥 [initiatePayment] FAILED - Duration: ${duration}ms`);
      console.error('   Error:', error.message);
      console.error('   Stack:', error.stack);
      console.error('   Request Details:', {
        studentIdentifier,
        paymentData,
        transactionId
      });
      
      throw new Error(`Payment initiation failed: ${error.message}`);
    }
  }

  /**
   * Check payment status
   * @param {String} reference - Transaction reference
   * @returns {Object} Payment status
   */
  async checkPaymentStatus(reference) {
    console.log(`\n🔍 [checkPaymentStatus] Checking status for reference: ${reference}`);
    console.log('   Timestamp:', new Date().toISOString());
    
    try {
      const transaction = await PayNowTransaction.findOne({ reference });
      
      if (!transaction) {
        console.error(`❌ [checkPaymentStatus] Transaction not found: ${reference}`);
        throw new Error(`Transaction not found with reference: ${reference}`);
      }

      console.log('   Transaction found:', {
        _id: transaction._id,
        status: transaction.status,
        amount: transaction.amount,
        studentId: transaction.studentId
      });

      if (!transaction.pollUrl) {
        console.error('❌ [checkPaymentStatus] Poll URL not available');
        throw new Error(`Poll URL not available for transaction: ${reference}. Transaction may not have been properly initialized.`);
      }

      console.log('   Poll URL available, calling PayNow API...');
      
      // Check status from PayNow
      const status = await paynowConfig.checkPaymentStatus(transaction.pollUrl);
      
      console.log('   PayNow API response:', {
        paid: status.paid,
        status: status.status,
        paynowReference: status.paynowReference,
        method: status.method
      });

      // Update transaction status
      const oldStatus = transaction.status;
      transaction.status = status.paid ? 'paid' : 
                         status.status === 'cancelled' ? 'cancelled' :
                         status.status === 'failed' ? 'failed' : 'pending';
      
      console.log(`   Status update: ${oldStatus} → ${transaction.status}`);
      
      if (status.paid) {
        console.log('   ✅ Payment marked as PAID');
        transaction.paynowReference = status.paynowReference;
        transaction.paymentMethod = status.paymentMethod;
        transaction.paymentDate = new Date();
        
        // Update fee record
        const fee = await Fee.findById(transaction.fee);
        if (fee) {
          console.log('   🔄 Updating fee record:', fee._id);
          
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
          
          console.log('   ✅ Fee record updated');
          console.log('      New paid amount:', fee.paidAmount);
          console.log('      New balance:', fee.balance);
          console.log('      New status:', fee.status);
        } else {
          console.warn('   ⚠️ Fee record not found for transaction');
        }
      }

      await transaction.save();
      console.log('   ✅ Transaction saved with updated status');

      const result = {
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
      
      console.log('✅ [checkPaymentStatus] COMPLETE');
      return result;
      
    } catch (error) {
      console.error(`💥 [checkPaymentStatus] FAILED for reference: ${reference}`);
      console.error('   Error:', error.message);
      console.error('   Stack:', error.stack);
      throw new Error(`Status check failed: ${error.message}`);
    }
  }

  /**
   * Handle PayNow webhook (result URL callback)
   * @param {Object} webhookData - Webhook data from PayNow
   * @returns {Object} Webhook processing result
   */
  async handleWebhook(webhookData) {
    console.log(`\n🔗 [handleWebhook] Received webhook:`, JSON.stringify(webhookData, null, 2));
    console.log('   Timestamp:', new Date().toISOString());
    
    try {
      const { reference, paynowreference, status, amount, method } = webhookData;
      
      if (!reference) {
        console.error('❌ [handleWebhook] No reference in webhook data');
        return { success: false, message: 'No reference in webhook data' };
      }
      
      const transaction = await PayNowTransaction.findOne({ reference });
      
      if (!transaction) {
        console.warn(`⚠️ [handleWebhook] Transaction not found for reference: ${reference}`);
        return { success: false, message: `Transaction not found: ${reference}` };
      }

      console.log('   Transaction found:', {
        _id: transaction._id,
        currentStatus: transaction.status,
        amount: transaction.amount
      });

      // Update transaction
      const oldStatus = transaction.status;
      transaction.paynowReference = paynowreference || transaction.paynowReference;
      transaction.paymentMethod = method || transaction.paymentMethod;
      transaction.status = status ? status.toLowerCase() : transaction.status;
      
      console.log(`   Status update: ${oldStatus} → ${transaction.status}`);
      
      if (status && status.toLowerCase() === 'paid') {
        console.log('   ✅ Webhook indicates PAID status');
        transaction.paymentDate = new Date();
        
        // Update fee record
        const fee = await Fee.findById(transaction.fee);
        if (fee) {
          console.log('   🔄 Updating fee record from webhook');
          
          // Check if this payment was already recorded
          const existingPayment = fee.payments.find(p => p.receiptNumber === paynowreference);
          
          if (!existingPayment) {
            fee.payments.push({
              amount: amount || transaction.amount,
              paymentDate: new Date(),
              paymentMethod: 'paynow',
              receiptNumber: paynowreference || `WEBHOOK-${Date.now()}`,
              receivedBy: transaction.student,
              notes: `Paid via PayNow Webhook - Reference: ${paynowreference || 'unknown'}`
            });
            
            fee.paidAmount += (amount || transaction.amount);
            await fee.save();
            
            console.log('   ✅ Fee record updated via webhook');
          } else {
            console.log('   ⚠️ Payment already recorded in fee');
          }
        }
      }

      await transaction.save();
      
      console.log(`✅ [handleWebhook] Processed successfully for reference: ${reference}`);
      
      return {
        success: true,
        message: 'Webhook processed successfully',
        reference: reference,
        status: status || transaction.status
      };
      
    } catch (error) {
      console.error('💥 [handleWebhook] FAILED');
      console.error('   Error:', error.message);
      console.error('   Stack:', error.stack);
      console.error('   Webhook Data:', webhookData);
      throw new Error(`Webhook processing failed: ${error.message}`);
    }
  }

  /**
   * Get transaction history for a student
   * @param {String} studentIdentifier - Student ID (MongoDB _id or studentId string)
   * @returns {Array} Transaction history
   */
  async getStudentTransactions(studentIdentifier) {
    console.log(`\n📋 [getStudentTransactions] Request for identifier: ${studentIdentifier}`);
    
    try {
      // Find student first to get MongoDB _id
      const student = await this.findStudentByIdentifier(studentIdentifier);
      
      if (!student) {
        console.error(`❌ [getStudentTransactions] Student not found: ${studentIdentifier}`);
        return {
          success: false,
          message: `Student not found: ${studentIdentifier}`,
          count: 0,
          data: []
        };
      }
      
      console.log('   Student found, MongoDB _id:', student._id);
      
      const transactions = await PayNowTransaction.find({ student: student._id })
        .sort({ createdAt: -1 });
      
      console.log(`   Found ${transactions.length} transaction(s)`);
      
      return {
        success: true,
        count: transactions.length,
        data: transactions,
        studentInfo: {
          _id: student._id,
          studentId: student.studentId,
          name: student.user ? `${student.user.firstName} ${student.user.lastName}` : 'Unknown'
        }
      };
      
    } catch (error) {
      console.error(`💥 [getStudentTransactions] FAILED for identifier: ${studentIdentifier}`);
      console.error('   Error:', error.message);
      return {
        success: false,
        message: `Failed to get transactions: ${error.message}`,
        count: 0,
        data: []
      };
    }
  }

  /**
   * Cancel a pending transaction
   * @param {String} reference - Transaction reference
   * @returns {Object} Cancellation result
   */
  async cancelTransaction(reference) {
    console.log(`\n❌ [cancelTransaction] Request for reference: ${reference}`);
    
    try {
      const transaction = await PayNowTransaction.findOne({ reference });
      
      if (!transaction) {
        console.error(`   Transaction not found: ${reference}`);
        throw new Error(`Transaction not found: ${reference}`);
      }

      console.log('   Transaction found:', {
        status: transaction.status,
        amount: transaction.amount,
        studentId: transaction.studentId
      });

      if (transaction.status !== 'pending') {
        console.error(`   Cannot cancel - current status: ${transaction.status}`);
        throw new Error(`Cannot cancel transaction with status: ${transaction.status}. Only pending transactions can be cancelled.`);
      }

      transaction.status = 'cancelled';
      await transaction.save();
      
      console.log('   ✅ Transaction cancelled successfully');
      
      return {
        success: true,
        message: 'Transaction cancelled successfully',
        reference: reference
      };
      
    } catch (error) {
      console.error(`💥 [cancelTransaction] FAILED for reference: ${reference}`);
      console.error('   Error:', error.message);
      throw new Error(`Cancellation failed: ${error.message}`);
    }
  }
}

module.exports = new PayNowService();