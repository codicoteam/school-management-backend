// models/Teacher.js
const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherId: {
    type: String,
    required: true,
    unique: true
  },
  assignedClass: {
    grade: String,
    className: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Teacher', teacherSchema);