const studentService = require('../services/studentService');
const Student = require('../models/Student');
const User = require('../models/User');

class StudentController {
  async changeClass(req, res) {
    try {
      const { studentId, newGrade, newClassName } = req.body;
      const result = await studentService.changeStudentClass(studentId, newGrade, newClassName);
      res.status(200).json({
        success: true,
        message: 'Student class changed successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  async getStudent(req, res) {
    try {
      const { id } = req.params;
      const student = await Student.findById(id)
        .populate('user', 'firstName lastName email phone')
        .populate('teacher', 'user')
        .populate('parents', 'user');
      
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

  async getAllStudents(req, res) {
    try {
      const students = await Student.find()
        .populate('user', 'firstName lastName email')
        .populate('teacher', 'user');
      
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

  async getStudentsByClass(req, res) {
    try {
      const { grade, className } = req.params;
      const students = await Student.find({ 
        currentGrade: grade, 
        currentClass: `${grade}${className}` 
      })
        .populate('user', 'firstName lastName email')
        .populate('teacher', 'user');
      
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

  async createStudent(req, res) {
    try {
      const { userId, studentId, currentGrade, currentClass, dateOfBirth, gender } = req.body;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const student = new Student({
        user: userId,
        studentId,
        currentGrade,
        currentClass: `${currentGrade}${currentClass}`,
        dateOfBirth,
        gender
      });

      await student.save();
      
      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: student
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateStudent(req, res) {
    try {
      const { id } = req.params;
      const { currentGrade, currentClass, dateOfBirth, gender } = req.body;
      
      const student = await Student.findById(id);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      if (currentGrade && currentClass) {
        student.currentGrade = currentGrade;
        student.currentClass = `${currentGrade}${currentClass}`;
      }
      if (dateOfBirth) student.dateOfBirth = dateOfBirth;
      if (gender) student.gender = gender;

      await student.save();
      
      res.status(200).json({
        success: true,
        message: 'Student updated successfully',
        data: student
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteStudent(req, res) {
    try {
      const { id } = req.params;
      
      const student = await Student.findById(id);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      await student.deleteOne();
      
      res.status(200).json({
        success: true,
        message: 'Student deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new StudentController();