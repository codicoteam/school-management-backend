// src/services/feeService.js
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Fee = require('../models/Fee');
const FeeStructure = require('../models/FeeStructure');

class FeeService {
  
  // Process payment (for receptionist)
  async processPayment(studentId, paymentData) {
    const { amount, term, academicYear, paymentMethod, receivedBy } = paymentData;
    
    // Get student's current class
    const student = await Student.findById(studentId);
    if (!student) throw new Error('Student not found');
    
    // Find or create fee record
    let fee = await Fee.findOne({
      student: studentId,
      term: term,
      academicYear: academicYear
    });
    
    if (!fee) {
      // Get fee amount from FeeStructure
      const feeStructure = await FeeStructure.findOne({
        grade: student.currentClass,
        term: term,
        academicYear: academicYear,
        isActive: true
      });
      
      if (!feeStructure) {
        throw new Error(`Fee structure not found for ${student.currentClass}, ${term} ${academicYear}`);
      }
      
      // Create new fee record with actual amount from fee structure
      fee = new Fee({
        student: studentId,
        term: term,
        academicYear: academicYear,
        totalAmount: feeStructure.amount,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    }
    
    // Validate payment amount doesn't exceed balance
    if (amount > fee.balance) {
      throw new Error(`Payment amount (${amount}) exceeds outstanding balance (${fee.balance})`);
    }
    
    // Generate receipt number
    const receiptNumber = `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Add payment
    fee.payments.push({
      amount: amount,
      paymentMethod: paymentMethod,
      receivedBy: receivedBy,
      receiptNumber: receiptNumber,
      paymentDate: new Date()
    });
    
    fee.paidAmount += amount;
    await fee.save();
    
    return {
      receiptNumber,
      newBalance: fee.balance,
      studentId: studentId,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      term: term,
      academicYear: academicYear
    };
  }
  
  // Get student fee statement
  async getStudentFeeStatement(studentId) {
    const fees = await Fee.find({ student: studentId })
      .sort({ academicYear: -1, term: 1 });
    
    const student = await Student.findById(studentId)
      .populate('user', 'firstName lastName')
      .populate('teacher', 'user');
    
    const totalAmount = fees.reduce((sum, fee) => sum + fee.totalAmount, 0);
    const totalPaid = fees.reduce((sum, fee) => sum + fee.paidAmount, 0);
    const totalBalance = fees.reduce((sum, fee) => sum + fee.balance, 0);
    
    return {
      student: {
        name: `${student.user.firstName} ${student.user.lastName}`,
        studentId: student.studentId,
        currentClass: student.currentClass,
        teacher: student.teacher ? student.teacher.user.firstName : 'Not assigned'
      },
      summary: {
        totalAmount,
        totalPaid,
        totalBalance,
        paidPercentage: totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0
      },
      feeRecords: fees.map(fee => ({
        term: fee.term,
        academicYear: fee.academicYear,
        totalAmount: fee.totalAmount,
        paidAmount: fee.paidAmount,
        balance: fee.balance,
        status: fee.status,
        dueDate: fee.dueDate,
        payments: fee.payments.length,
        lastPayment: fee.payments.length > 0 ? {
          date: fee.payments[fee.payments.length - 1].paymentDate,
          amount: fee.payments[fee.payments.length - 1].amount,
          receiptNumber: fee.payments[fee.payments.length - 1].receiptNumber
        } : null
      }))
    };
  }
}

module.exports = new FeeService();