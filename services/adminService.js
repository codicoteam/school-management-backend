// src/services/adminService.js
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Fee = require('../models/Fee');
const FeeStructure = require('../models/FeeStructure');

class AdminService {
  
  // Get overall school statistics
  async getSchoolStatistics() {
    const [students, teachers, fees, feeStructures] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Fee.find().populate('student'),
      FeeStructure.find({ isActive: true })
    ]);
    
    const totalAmount = fees.reduce((sum, fee) => sum + fee.totalAmount, 0);
    const totalPaid = fees.reduce((sum, fee) => sum + fee.paidAmount, 0);
    const totalBalance = fees.reduce((sum, fee) => sum + fee.balance, 0);
    
    // Calculate statistics by class
    const classStats = {};
    fees.forEach(fee => {
      if (fee.student && fee.student.currentClass) {
        const className = fee.student.currentClass;
        if (!classStats[className]) {
          classStats[className] = {
            totalAmount: 0,
            totalPaid: 0,
            totalBalance: 0,
            studentCount: 0
          };
        }
        classStats[className].totalAmount += fee.totalAmount;
        classStats[className].totalPaid += fee.paidAmount;
        classStats[className].totalBalance += fee.balance;
      }
    });
    
    // Count students per class
    const allStudents = await Student.find();
    allStudents.forEach(student => {
      if (student.currentClass && classStats[student.currentClass]) {
        classStats[student.currentClass].studentCount = 
          (classStats[student.currentClass].studentCount || 0) + 1;
      }
    });
    
    // Get recent payments
    const recentPayments = fees
      .flatMap(fee => fee.payments.map(p => ({
        date: p.paymentDate,
        amount: p.amount,
        receiptNumber: p.receiptNumber,
        method: p.paymentMethod,
        studentId: fee.student._id,
        studentName: fee.student.user ? 
          `${fee.student.user.firstName} ${fee.student.user.lastName}` : 'Unknown'
      })))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
    
    return {
      overview: {
        totalStudents: students,
        totalTeachers: teachers,
        activeFeeStructures: feeStructures.length
      },
      feeSummary: {
        totalAmount,
        totalPaid,
        totalBalance,
        collectionRate: totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0,
        outstandingStudents: fees.filter(f => f.balance > 0).length,
        fullyPaidStudents: fees.filter(f => f.balance <= 0).length
      },
      classStats: Object.entries(classStats).map(([className, stats]) => ({
        className,
        studentCount: stats.studentCount || 0,
        totalAmount: stats.totalAmount,
        totalPaid: stats.totalPaid,
        totalBalance: stats.totalBalance,
        collectionRate: stats.totalAmount > 0 ? 
          Math.round((stats.totalPaid / stats.totalAmount) * 100) : 0
      })),
      recentPayments,
      feeStructuresSummary: feeStructures.map(fs => ({
        grade: fs.grade,
        term: fs.term,
        academicYear: fs.academicYear,
        amount: fs.amount,
        isActive: fs.isActive
      }))
    };
  }
  
  // Create or update fee structure
  async updateFeeStructure(feeStructureData) {
    const { grade, term, academicYear, amount } = feeStructureData;
    
    // Check if fee structure exists
    let feeStructure = await FeeStructure.findOne({
      grade: grade,
      term: term,
      academicYear: academicYear
    });
    
    if (feeStructure) {
      // Update existing
      feeStructure.amount = amount;
      feeStructure.isActive = feeStructureData.isActive !== undefined ? 
        feeStructureData.isActive : feeStructure.isActive;
    } else {
      // Create new
      feeStructure = new FeeStructure({
        grade: grade,
        term: term,
        academicYear: academicYear,
        amount: amount,
        isActive: true
      });
    }
    
    await feeStructure.save();
    return feeStructure;
  }
  
  // Get fee structure for a specific class
  async getClassFeeStructure(grade, academicYear) {
    return await FeeStructure.find({
      grade: grade,
      academicYear: academicYear,
      isActive: true
    }).sort({ term: 1 });
  }
}

module.exports = new AdminService();