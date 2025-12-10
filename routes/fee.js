const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { protect, authorize } = require('../middlewares/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       required:
 *         - amount
 *         - paymentMethod
 *       properties:
 *         amount:
 *           type: number
 *         paymentMethod:
 *           type: string
 *           enum: [cash, bank-transfer, mobile-money]
 *         paymentDate:
 *           type: string
 *           format: date-time
 *         receiptNumber:
 *           type: string
 *         receivedBy:
 *           type: string
 * 
 *     Fee:
 *       type: object
 *       required:
 *         - student
 *         - term
 *         - academicYear
 *         - totalAmount
 *       properties:
 *         id:
 *           type: string
 *         student:
 *           type: string
 *         term:
 *           type: string
 *           enum: [Term 1, Term 2, Term 3]
 *         academicYear:
 *           type: string
 *         totalAmount:
 *           type: number
 *         paidAmount:
 *           type: number
 *         balance:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, partial, paid, overdue]
 *         dueDate:
 *           type: string
 *           format: date
 *         payments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Payment'
 */

/**
 * @swagger
 * tags:
 *   name: Fees
 *   description: Fee management endpoints
 */

/**
 * @swagger
 * /api/fees:
 *   get:
 *     summary: Get all fees
 *     tags: [Fees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all fees
 */
router.get('/', protect, authorize('admin'), feeController.getAllFees);

/**
 * @swagger
 * /api/fees/{id}:
 *   get:
 *     summary: Get fee by ID
 *     tags: [Fees]
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
 *         description: Fee details
 */
router.get('/:id', protect, authorize('admin', 'teacher', 'receptionist'), feeController.getFee);

/**
 * @swagger
 * /api/fees:
 *   post:
 *     summary: Create a new fee record
 *     tags: [Fees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - student
 *               - term
 *               - academicYear
 *               - totalAmount
 *             properties:
 *               student:
 *                 type: string
 *               term:
 *                 type: string
 *               academicYear:
 *                 type: string
 *               totalAmount:
 *                 type: number
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Fee created successfully
 */
router.post('/', protect, authorize('admin'), feeController.createFee);

/**
 * @swagger
 * /api/fees/{id}:
 *   put:
 *     summary: Update fee
 *     tags: [Fees]
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
 *               totalAmount:
 *                 type: number
 *               dueDate:
 *                 type: string
 *     responses:
 *       200:
 *         description: Fee updated successfully
 */
router.put('/:id', protect, authorize('admin'), feeController.updateFee);

/**
 * @swagger
 * /api/fees/{id}:
 *   delete:
 *     summary: Delete fee
 *     tags: [Fees]
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
 *         description: Fee deleted successfully
 */
router.delete('/:id', protect, authorize('admin'), feeController.deleteFee);

/**
 * @swagger
 * /api/fees/payment:
 *   post:
 *     summary: Process a payment
 *     tags: [Fees]
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
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment processed successfully
 */
router.post('/payment', protect, authorize('admin', 'receptionist'), feeController.processPayment);

/**
 * @swagger
 * /api/fees/statement/{studentId}:
 *   get:
 *     summary: Get student fee statement
 *     tags: [Fees]
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
 *         description: Student fee statement
 */
router.get('/statement/:studentId', protect, authorize('admin', 'teacher', 'receptionist', 'student'), feeController.getFeeStatement);

module.exports = router;