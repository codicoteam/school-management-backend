// utils/schoolUtils.js
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Fee = require('../models/Fee');
const FeeStructure = require('../models/FeeStructure');

class SchoolUtils {
  
  // Change student class
  static async changeStudentClass(studentId, newGrade, newClassName) {
    const student = await Student.findById(studentId);
    if (!student) throw new Error('Student not found');
    
    student.currentGrade = newGrade;
    student.currentClass = `${newGrade}${newClassName}`;
    
    // Find teacher for the new class
    const teacher = await Teacher.findOne({
      'assignedClass.grade': newGrade,
      'assignedClass.className': newClassName
    });
    
    if (teacher) {
      student.teacher = teacher._id;
    }
    
    await student.save();
    return student;
  }
  
  // Assign teacher to class (one teacher per class)
  static async assignTeacherToClass(teacherId, grade, className) {
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
  static async getTeacherClassFees(teacherId) {
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
  
  // Process payment (for receptionist)
  static async processPayment(studentId, paymentData) {
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
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
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
  static async getStudentFeeStatement(studentId) {
    const fees = await Fee.find({ student: studentId })
      .sort({ academicYear: -1, term: 1 });
    
    const student = await Student.findById(studentId)
      .populate('user', 'firstName lastName')
      .populate('teacher', 'user');
    
    const totalAmount = fees.reduce((sum, fee) => sum + fee.totalAmount, 0);
    const totalPaid = fees.reduce((sum, fee) => sum + fee.paidAmount, 0);
    const totalBalance = fees.reduce((sum, fee) => sum + fee.balance, 0);
    
    // Get current term fee structure if exists
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear().toString();
    const currentTerm = this.getCurrentTerm();
    
    const currentFeeStructure = await FeeStructure.findOne({
      grade: student.currentClass,
      term: currentTerm,
      academicYear: currentYear,
      isActive: true
    });
    
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
      currentTermInfo: currentFeeStructure ? {
        term: currentTerm,
        academicYear: currentYear,
        amountDue: currentFeeStructure.amount,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      } : null,
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
  
  // Get overall school statistics (for admin)
  static async getSchoolStatistics() {
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
  
  // Create or update fee structure (for admin)
  static async updateFeeStructure(feeStructureData) {
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
  
  // Helper: Get current term based on month
  static getCurrentTerm() {
    const month = new Date().getMonth() + 1; // 1-12
    
    if (month >= 1 && month <= 4) return 'Term 1';
    if (month >= 5 && month <= 8) return 'Term 2';
    return 'Term 3';
  }
  
  // Get fee structure for a specific class
  static async getClassFeeStructure(grade, academicYear) {
    return await FeeStructure.find({
      grade: grade,
      academicYear: academicYear,
      isActive: true
    }).sort({ term: 1 });
  }
  
  // Generate fee report for multiple students
  static async generateFeeReport(studentIds, term, academicYear) {
    const reportData = await Promise.all(
      studentIds.map(async (studentId) => {
        const student = await Student.findById(studentId)
          .populate('user', 'firstName lastName')
          .populate('parents', 'user');
        
        let fee = await Fee.findOne({
          student: studentId,
          term: term,
          academicYear: academicYear
        });
        
        if (!fee) {
          // Check fee structure
          const feeStructure = await FeeStructure.findOne({
            grade: student.currentClass,
            term: term,
            academicYear: academicYear,
            isActive: true
          });
          
          return {
            student: `${student.user.firstName} ${student.user.lastName}`,
            studentId: student.studentId,
            currentClass: student.currentClass,
            feeAmount: feeStructure ? feeStructure.amount : 0,
            paidAmount: 0,
            balance: feeStructure ? feeStructure.amount : 0,
            status: 'pending',
            parents: student.parents.map(p => p.user ? 
              `${p.user.firstName} ${p.user.lastName}` : 'Unknown')
          };
        }
        
        return {
          student: `${student.user.firstName} ${student.user.lastName}`,
          studentId: student.studentId,
          currentClass: student.currentClass,
          feeAmount: fee.totalAmount,
          paidAmount: fee.paidAmount,
          balance: fee.balance,
          status: fee.status,
          parents: student.parents.map(p => p.user ? 
            `${p.user.firstName} ${p.user.lastName}` : 'Unknown'),
          lastPayment: fee.payments.length > 0 ? 
            fee.payments[fee.payments.length - 1].paymentDate : null
        };
      })
    );
    
    return {
      term: term,
      academicYear: academicYear,
      generatedDate: new Date(),
      totalStudents: reportData.length,
      totalAmount: reportData.reduce((sum, student) => sum + student.feeAmount, 0),
      totalPaid: reportData.reduce((sum, student) => sum + student.paidAmount, 0),
      totalBalance: reportData.reduce((sum, student) => sum + student.balance, 0),
      students: reportData
    };
  }
}

module.exports = SchoolUtils;