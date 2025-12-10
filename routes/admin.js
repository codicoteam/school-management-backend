const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

/**
 * @swagger
 * /api/admin/statistics:
 *   get:
 *     summary: Get overall school statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: School statistics
 */
router.get('/statistics', protect, authorize('admin'), adminController.getStatistics);

/**
 * @swagger
 * /api/admin/fee-structure:
 *   post:
 *     summary: Create or update fee structure
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grade
 *               - term
 *               - academicYear
 *               - amount
 *             properties:
 *               grade:
 *                 type: string
 *                 example: "2A"
 *               term:
 *                 type: string
 *                 enum: [Term 1, Term 2, Term 3]
 *               academicYear:
 *                 type: string
 *               amount:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Fee structure updated
 */
router.post('/fee-structure', protect, authorize('admin'), adminController.updateFeeStructure);

/**
 * @swagger
 * /api/admin/fee-structure/{id}:
 *   delete:
 *     summary: Delete fee structure
 *     tags: [Admin]
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
 *         description: Fee structure deleted
 */
router.delete('/fee-structure/:id', protect, authorize('admin'), adminController.deleteFeeStructure);

/**
 * @swagger
 * /api/admin/fee-structure:
 *   get:
 *     summary: Get all fee structures
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all fee structures
 */
router.get('/fee-structure', protect, authorize('admin'), adminController.getAllFeeStructures);

/**
 * @swagger
 * /api/admin/fee-structure/{grade}/{academicYear}:
 *   get:
 *     summary: Get fee structure for a class
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: grade
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: academicYear
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Class fee structure
 */
router.get('/fee-structure/:grade/:academicYear', protect, authorize('admin', 'teacher'), adminController.getClassFeeStructure);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 */
router.get('/users', protect, authorize('admin'), adminController.getAllUsers);

module.exports = router;