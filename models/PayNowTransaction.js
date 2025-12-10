const mongoose = require('mongoose');

const payNowTransactionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  fee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fee'
  },
  reference: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  term: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  redirectUrl: {
    type: String
  },
  pollUrl: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled', 'failed', 'awaiting_delivery', 'delivered'],
    default: 'pending'
  },
  paynowReference: {
    type: String
  },
  paymentMethod: {
    type: String
  },
  paymentDate: {
    type: Date
  },
  studentEmail: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  studentId: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
payNowTransactionSchema.index({ reference: 1 });
payNowTransactionSchema.index({ student: 1, status: 1 });
payNowTransactionSchema.index({ createdAt: 1 });

module.exports = mongoose.model('PayNowTransaction', payNowTransactionSchema);