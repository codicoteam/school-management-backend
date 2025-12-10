// src/services/receptionistService.js
const Student = require('../models/Student');
const Fee = require('../models/Fee');

class ReceptionistService {
  
  // Get student by ID or studentId
  async getStudentInfo(identifier) {
    let student;
    
    // Try to find by studentId first
    student = await Student.findOne({ studentId: identifier })
      .populate('user', 'firstName lastName email phone')
      .populate('parents', 'user');
    
    // If not found by studentId, try by _id
    if (!student) {
      student = await Student.findById(identifier)
        .populate('user', 'firstName lastName email phone')
        .populate('parents', 'user');
    }
    
    return student;
  }
  
  // Search students by name
  async searchStudents(name) {
    return await Student.find()
      .populate({
        path: 'user',
        match: {
          $or: [
            { firstName: { $regex: name, $options: 'i' } },
            { lastName: { $regex: name, $options: 'i' } }
          ]
        }
      })
      .then(students => students.filter(s => s.user));
  }
  
  // Get fee status for a student
  async getStudentFeeStatus(studentId) {
    const fees = await Fee.find({ student: studentId })
      .sort({ academicYear: -1, term: 1 });
    
    const totalBalance = fees.reduce((sum, fee) => sum + fee.balance, 0);
    const totalPaid = fees.reduce((sum, fee) => sum + fee.paidAmount, 0);
    
    return {
      totalBalance,
      totalPaid,
      feeRecords: fees.map(fee => ({
        term: fee.term,
        academicYear: fee.academicYear,
        totalAmount: fee.totalAmount,
        paidAmount: fee.paidAmount,
        balance: fee.balance,
        status: fee.status,
        lastPayment: fee.payments.length > 0 ? {
          date: fee.payments[fee.payments.length - 1].paymentDate,
          amount: fee.payments[fee.payments.length - 1].amount,
          receiptNumber: fee.payments[fee.payments.length - 1].receiptNumber
        } : null
      }))
    };
  }
}

module.exports = new ReceptionistService();