const teacherService = require('../services/teacherService');
const Teacher = require('../models/Teacher');
const User = require('../models/User');

class TeacherController {
  async assignToClass(req, res) {
    try {
      const { teacherId, grade, className } = req.body;
      const result = await teacherService.assignTeacherToClass(teacherId, grade, className);
      res.status(200).json({
        success: true,
        message: 'Teacher assigned to class successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  async getClassFees(req, res) {
    try {
      const { teacherId } = req.params;
      const result = await teacherService.getTeacherClassFees(teacherId);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  async getTeacher(req, res) {
    try {
      const { id } = req.params;
      const teacher = await Teacher.findById(id)
        .populate('user', 'firstName lastName email phone');
      
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: teacher
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getAllTeachers(req, res) {
    try {
      const teachers = await Teacher.find()
        .populate('user', 'firstName lastName email');
      
      res.status(200).json({
        success: true,
        count: teachers.length,
        data: teachers
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async createTeacher(req, res) {
    try {
      const { userId, teacherId, qualifications, subjects } = req.body;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const teacher = new Teacher({
        user: userId,
        teacherId,
        qualifications: qualifications || [],
        subjects: subjects || []
      });

      await teacher.save();
      
      res.status(201).json({
        success: true,
        message: 'Teacher created successfully',
        data: teacher
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateTeacher(req, res) {
    try {
      const { id } = req.params;
      const { qualifications, subjects, assignedClass } = req.body;
      
      const teacher = await Teacher.findById(id);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      if (qualifications) teacher.qualifications = qualifications;
      if (subjects) teacher.subjects = subjects;
      if (assignedClass) teacher.assignedClass = assignedClass;

      await teacher.save();
      
      res.status(200).json({
        success: true,
        message: 'Teacher updated successfully',
        data: teacher
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteTeacher(req, res) {
    try {
      const { id } = req.params;
      
      const teacher = await Teacher.findById(id);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      await teacher.deleteOne();
      
      res.status(200).json({
        success: true,
        message: 'Teacher deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new TeacherController();