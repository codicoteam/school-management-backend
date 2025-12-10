const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect, authorize } = require('../middlewares/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Student:
 *       type: object
 *       required:
 *         - user
 *         - studentId
 *         - currentGrade
 *         - currentClass
 *       properties:
 *         id:
 *           type: string
 *         studentId:
 *           type: string
 *           description: Unique student identifier
 *         user:
 *           $ref: '#/components/schemas/User'
 *         currentGrade:
 *           type: string
 *           example: "2"
 *         currentClass:
 *           type: string
 *           example: "2A"
 *         parents:
 *           type: array
 *           items:
 *             type: string
 *         teacher:
 *           type: string
 *       example:
 *         id: 64f7a1b2c8d9e6f5a1b2c3d5
 *         studentId: "STU202412345"
 *         user: {}
 *         currentGrade: "2"
 *         currentClass: "2A"
 *         parents: []
 */

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Student management endpoints
 */

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Get all students
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all students
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Student'
 */
router.get('/', protect, authorize('admin', 'teacher', 'receptionist'), studentController.getAllStudents);

/**
 * @swagger
 * /api/students/{id}:
 *   get:
 *     summary: Get student by ID
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       404:
 *         description: Student not found
 */
router.get('/:id', protect, authorize('admin', 'teacher', 'receptionist', 'student'), studentController.getStudent);

/**
 * @swagger
 * /api/students:
 *   post:
 *     summary: Create a new student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - studentId
 *               - currentGrade
 *               - currentClass
 *             properties:
 *               userId:
 *                 type: string
 *               studentId:
 *                 type: string
 *               currentGrade:
 *                 type: string
 *               currentClass:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *     responses:
 *       201:
 *         description: Student created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', protect, authorize('admin', 'receptionist'), studentController.createStudent);

/**
 * @swagger
 * /api/students/{id}:
 *   put:
 *     summary: Update student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentGrade:
 *                 type: string
 *               currentClass:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *               gender:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student updated successfully
 *       404:
 *         description: Student not found
 */
router.put('/:id', protect, authorize('admin', 'receptionist'), studentController.updateStudent);

/**
 * @swagger
 * /api/students/{id}:
 *   delete:
 *     summary: Delete student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *       404:
 *         description: Student not found
 */
router.delete('/:id', protect, authorize('admin'), studentController.deleteStudent);

/**
 * @swagger
 * /api/students/change-class:
 *   post:
 *     summary: Change student's class
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - newGrade
 *               - newClassName
 *             properties:
 *               studentId:
 *                 type: string
 *               newGrade:
 *                 type: string
 *                 example: "2"
 *               newClassName:
 *                 type: string
 *                 example: "B"
 *     responses:
 *       200:
 *         description: Student class changed successfully
 *       400:
 *         description: Invalid input
 */
router.post('/change-class', protect, authorize('admin', 'receptionist'), studentController.changeClass);

/**
 * @swagger
 * /api/students/class/{grade}/{className}:
 *   get:
 *     summary: Get students by class
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: grade
 *         required: true
 *         schema:
 *           type: string
 *           example: "2"
 *       - in: path
 *         name: className
 *         required: true
 *         schema:
 *           type: string
 *           example: "A"
 *     responses:
 *       200:
 *         description: List of students in the specified class
 */
router.get('/class/:grade/:className', protect, authorize('admin', 'teacher', 'receptionist'), studentController.getStudentsByClass);

module.exports = router;