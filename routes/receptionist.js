const express = require('express');
const router = express.Router();
const receptionistController = require('../controllers/receptionistController');
const { protect, authorize } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Receptionist
 *   description: Receptionist management endpoints
 */

/**
 * @swagger
 * /api/receptionist/student/{identifier}:
 *   get:
 *     summary: Get student information
 *     tags: [Receptionist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID or studentId
 *     responses:
 *       200:
 *         description: Student information
 */
router.get('/student/:identifier', protect, authorize('receptionist', 'admin', 'teacher'), receptionistController.getStudentInfo);

/**
 * @swagger
 * /api/receptionist/students/search:
 *   get:
 *     summary: Search students by name
 *     tags: [Receptionist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of matching students
 */
router.get('/students/search', protect, authorize('receptionist', 'admin', 'teacher'), receptionistController.searchStudents);

/**
 * @swagger
 * /api/receptionist/fee-status/{studentId}:
 *   get:
 *     summary: Get student fee status
 *     tags: [Receptionist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student fee status
 */
router.get('/fee-status/:studentId', protect, authorize('receptionist', 'admin', 'teacher'), receptionistController.getFeeStatus);

/**
 * @swagger
 * /api/receptionist/payment:
 *   post:
 *     summary: Process a payment (receptionist)
 *     tags: [Receptionist]
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
 *               - amount
 *               - term
 *               - academicYear
 *               - paymentMethod
 *               - receivedBy
 *             properties:
 *               studentId:
 *                 type: string
 *               amount:
 *                 type: number
 *               term:
 *                 type: string
 *                 enum: [Term 1, Term 2, Term 3]
 *               academicYear:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, bank-transfer, mobile-money]
 *               receivedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment processed successfully
 */
router.post('/payment', protect, authorize('receptionist', 'admin'), receptionistController.processPayment);

/**
 * @swagger
 * /api/receptionist/payments:
 *   get:
 *     summary: Get all payments (receptionist view)
 *     tags: [Receptionist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all payments
 */
router.get('/payments', protect, authorize('receptionist', 'admin'), receptionistController.getAllPayments);

module.exports = router;