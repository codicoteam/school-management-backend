const express = require('express');
const router = express.Router();
const paynowController = require('../controllers/paynowController');
const { protect, authorize } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: PayNow Payments
 *   description: PayNow online payment gateway integration
 */

/**
 * @swagger
 * /api/paynow/initiate:
 *   post:
 *     summary: Initiate PayNow payment for school fees
 *     tags: [PayNow Payments]
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
 *               - term
 *               - academicYear
 *               - amount
 *             properties:
 *               studentId:
 *                 type: string
 *               term:
 *                 type: string
 *                 enum: [Term 1, Term 2, Term 3]
 *               academicYear:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Payment initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactionId:
 *                       type: string
 *                     reference:
 *                       type: string
 *                     redirectUrl:
 *                       type: string
 *                     pollUrl:
 *                       type: string
 *                     amount:
 *                       type: number
 */
router.post('/initiate', protect, authorize('student', 'parent', 'admin', 'receptionist'), paynowController.initiatePayment);

/**
 * @swagger
 * /api/paynow/status/{reference}:
 *   get:
 *     summary: Check PayNow payment status
 *     tags: [PayNow Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status
 */
router.get('/status/:reference', protect, paynowController.checkStatus);

/**
 * @swagger
 * /api/paynow/webhook:
 *   post:
 *     summary: PayNow webhook endpoint (no auth required)
 *     tags: [PayNow Payments]
 *     description: This endpoint receives callbacks from PayNow. DO NOT require authentication.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/webhook', paynowController.handleWebhook);

/**
 * @swagger
 * /api/paynow/transactions/{studentId}:
 *   get:
 *     summary: Get student's PayNow transactions
 *     tags: [PayNow Payments]
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
 *         description: List of transactions
 */
router.get('/transactions/:studentId', protect, authorize('student', 'parent', 'admin', 'teacher', 'receptionist'), paynowController.getStudentTransactions);

/**
 * @swagger
 * /api/paynow/transactions:
 *   get:
 *     summary: Get all PayNow transactions (admin only)
 *     tags: [PayNow Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All transactions
 */
router.get('/transactions', protect, authorize('admin'), paynowController.getAllTransactions);

/**
 * @swagger
 * /api/paynow/cancel/{reference}:
 *   post:
 *     summary: Cancel pending PayNow transaction
 *     tags: [PayNow Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction cancelled
 */
router.post('/cancel/:reference', protect, authorize('student', 'admin', 'receptionist'), paynowController.cancelTransaction);

module.exports = router;