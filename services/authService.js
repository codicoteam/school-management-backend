// src/services/authService.js
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const Admin = require('../models/Admin');
const Receptionist = require('../models/Receptionist');
const bcrypt = require('bcryptjs');

class AuthService {
  
  // Register new user with role
  async register(userData) {
    const { username, email, password, role, firstName, lastName, phone } = userData;
    
    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }
    
    // Create user
    const user = new User({
      username,
      email,
      password,
      role,
      firstName,
      lastName,
      phone
    });
    
    await user.save();
    
    // Create role-specific record
    let roleRecord;
    const idSuffix = Date.now().toString().slice(-4);
    
    switch (role) {
      case 'student':
        roleRecord = new Student({
          user: user._id,
          studentId: `STU${idSuffix}`,
          currentGrade: '1',
          currentClass: '1A'
        });
        break;
        
      case 'teacher':
        roleRecord = new Teacher({
          user: user._id,
          teacherId: `TCH${idSuffix}`
        });
        break;
        
      case 'parent':
        roleRecord = new Parent({
          user: user._id,
          parentId: `PAR${idSuffix}`
        });
        break;
        
      case 'admin':
        roleRecord = new Admin({
          user: user._id,
          adminId: `ADM${idSuffix}`
        });
        break;
        
      case 'receptionist':
        roleRecord = new Receptionist({
          user: user._id,
          receptionistId: `REC${idSuffix}`
        });
        break;
    }
    
    if (roleRecord) {
      await roleRecord.save();
    }
    
    return {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      roleRecord
    };
  }
  
  // Login user
  async login(email, password) {
    const user = await User.findOne({ email });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }
    
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Get role-specific info
    let roleInfo;
    switch (user.role) {
      case 'student':
        roleInfo = await Student.findOne({ user: user._id });
        break;
      case 'teacher':
        roleInfo = await Teacher.findOne({ user: user._id });
        break;
      case 'parent':
        roleInfo = await Parent.findOne({ user: user._id });
        break;
      case 'admin':
        roleInfo = await Admin.findOne({ user: user._id });
        break;
      case 'receptionist':
        roleInfo = await Receptionist.findOne({ user: user._id });
        break;
    }
    
    return {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      roleInfo
    };
  }
}

module.exports = new AuthService();