const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { protect, authorize } = require('../middlewares/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Teacher:
 *       type: object
 *       required:
 *         - user
 *         - teacherId
 *       properties:
 *         id:
 *           type: string
 *         teacherId:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *         assignedClass:
 *           type: object
 *           properties:
 *             grade:
 *               type: string
 *             className:
 *               type: string
 *         qualifications:
 *           type: array
 *           items:
 *             type: object
 *         subjects:
 *           type: array
 *           items:
 *             type: string
 *       example:
 *         id: 64f7a1b2c8d9e6f5a1b2c3d6
 *         teacherId: "TCH202412345"
 *         user: {}
 *         assignedClass: { grade: "2", className: "A" }
 */

/**
 * @swagger
 * tags:
 *   name: Teachers
 *   description: Teacher management endpoints
 */

/**
 * @swagger
 * /api/teachers:
 *   get:
 *     summary: Get all teachers
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all teachers
 */
router.get('/', protect, authorize('admin', 'receptionist'), teacherController.getAllTeachers);

/**
 * @swagger
 * /api/teachers/{id}:
 *   get:
 *     summary: Get teacher by ID
 *     tags: [Teachers]
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
 *         description: Teacher details
 */
router.get('/:id', protect, authorize('admin', 'teacher', 'receptionist'), teacherController.getTeacher);

/**
 * @swagger
 * /api/teachers:
 *   post:
 *     summary: Create a new teacher
 *     tags: [Teachers]
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
 *               - teacherId
 *             properties:
 *               userId:
 *                 type: string
 *               teacherId:
 *                 type: string
 *               qualifications:
 *                 type: array
 *               subjects:
 *                 type: array
 *     responses:
 *       201:
 *         description: Teacher created successfully
 */
router.post('/', protect, authorize('admin'), teacherController.createTeacher);

/**
 * @swagger
 * /api/teachers/{id}:
 *   put:
 *     summary: Update teacher
 *     tags: [Teachers]
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
 *               qualifications:
 *                 type: array
 *               subjects:
 *                 type: array
 *               assignedClass:
 *                 type: object
 *     responses:
 *       200:
 *         description: Teacher updated successfully
 */
router.put('/:id', protect, authorize('admin'), teacherController.updateTeacher);

/**
 * @swagger
 * /api/teachers/{id}:
 *   delete:
 *     summary: Delete teacher
 *     tags: [Teachers]
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
 *         description: Teacher deleted successfully
 */
router.delete('/:id', protect, authorize('admin'), teacherController.deleteTeacher);

/**
 * @swagger
 * /api/teachers/assign-class:
 *   post:
 *     summary: Assign teacher to a class
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teacherId
 *               - grade
 *               - className
 *             properties:
 *               teacherId:
 *                 type: string
 *               grade:
 *                 type: string
 *                 example: "2"
 *               className:
 *                 type: string
 *                 example: "A"
 *     responses:
 *       200:
 *         description: Teacher assigned to class successfully
 */
router.post('/assign-class', protect, authorize('admin'), teacherController.assignToClass);

/**
 * @swagger
 * /api/teachers/{teacherId}/class-fees:
 *   get:
 *     summary: Get teacher's class fee overview
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Class fee information
 */
router.get('/:teacherId/class-fees', protect, authorize('teacher', 'admin'), teacherController.getClassFees);

module.exports = router;