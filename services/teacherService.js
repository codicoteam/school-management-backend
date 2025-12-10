// src/services/teacherService.js
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Fee = require('../models/Fee');

class TeacherService {
  
  // Assign teacher to class (one teacher per class)
  async assignTeacherToClass(teacherId, grade, className) {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) throw new Error('Teacher not found');
    
    // Remove teacher from previous class if any
    await Teacher.updateMany(
      { 'assignedClass.grade': grade, 'assignedClass.className': className },
      { $unset: { assignedClass: 1 } }
    );
    
    // Assign new class
    teacher.assignedClass = { grade, className };
    await teacher.save();
    
    // Update all students in this class
    await Student.updateMany(
      { currentGrade: grade, currentClass: `${grade}${className}` },
      { teacher: teacherId }
    );
    
    return teacher;
  }
  
  // Get teacher's class fee overview
  async getTeacherClassFees(teacherId) {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) throw new Error('Teacher not found');
    
    const students = await Student.find({ teacher: teacherId })
      .populate('user', 'firstName lastName');
    
    const feeData = await Promise.all(
      students.map(async (student) => {
        const fees = await Fee.find({ student: student._id });
        const totalBalance = fees.reduce((sum, fee) => sum + fee.balance, 0);
        const totalPaid = fees.reduce((sum, fee) => sum + fee.paidAmount, 0);
        const totalAmount = fees.reduce((sum, fee) => sum + fee.totalAmount, 0);
        
        return {
          student: `${student.user.firstName} ${student.user.lastName}`,
          studentId: student.studentId,
          totalAmount,
          totalPaid,
          totalBalance,
          fees: fees.map(fee => ({
            term: fee.term,
            academicYear: fee.academicYear,
            totalAmount: fee.totalAmount,
            paidAmount: fee.paidAmount,
            balance: fee.balance,
            status: fee.status
          }))
        };
      })
    );
    
    // Calculate class totals
    const classTotals = {
      totalAmount: feeData.reduce((sum, student) => sum + student.totalAmount, 0),
      totalPaid: feeData.reduce((sum, student) => sum + student.totalPaid, 0),
      totalBalance: feeData.reduce((sum, student) => sum + student.totalBalance, 0)
    };
    
    return {
      teacher: teacher,
      class: teacher.assignedClass,
      students: feeData,
      totalStudents: students.length,
      classTotals
    };
  }
  
  // Get teacher by ID
  async getTeacherById(teacherId) {
    return await Teacher.findById(teacherId)
      .populate('user', 'firstName lastName email phone');
  }
}

module.exports = new TeacherService();