// src/services/studentService.js
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

class StudentService {
  
  // Change student class
  async changeStudentClass(studentId, newGrade, newClassName) {
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
  
  // Get student by ID
  async getStudentById(studentId) {
    return await Student.findById(studentId)
      .populate('user', 'firstName lastName email phone')
      .populate('teacher', 'user')
      .populate('parents', 'user');
  }
  
  // Get all students
  async getAllStudents() {
    return await Student.find()
      .populate('user', 'firstName lastName email')
      .populate('teacher', 'user');
  }
  
  // Get students by class
  async getStudentsByClass(grade, className) {
    const classStr = `${grade}${className}`;
    return await Student.find({ currentClass: classStr })
      .populate('user', 'firstName lastName email')
      .populate('teacher', 'user');
  }
}

module.exports = new StudentService();