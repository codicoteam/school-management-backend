const { Paynow } = require("paynow");
require('dotenv').config();

class PayNowService {
  constructor() {
    // Use correct environment variable names
    this.paynow = new Paynow(
      process.env.PAYNOW_INTEGRATION_ID || "21408",
      process.env.PAYNOW_INTEGRATION_KEY || "19e7fa46-7943-4c69-8d02-93312aa7f4b3"
    );
    
    this.paynow.returnUrl = process.env.PAYNOW_RETURN_URL || "http://localhost:3000/api/paynow/callback";
    this.paynow.resultUrl = process.env.PAYNOW_RESULT_URL || "http://localhost:3000/api/paynow/webhook";
  }

  async createPayment(feeData, studentData) {
    try {
      const reference = `SCHOOL_${studentData.studentId}_${Date.now()}`;
      const payment = this.paynow.createPayment(reference, studentData.email);
      payment.add(`School Fee - ${feeData.term} ${feeData.academicYear}`, feeData.amount);
      payment.add(`Student: ${studentData.name}`, 0);
      
      const response = await this.paynow.send(payment);
      
      return {
        success: response.success,
        reference: reference,
        redirectUrl: response.redirectUrl,
        pollUrl: response.pollUrl,
        instructions: response.instructions,
        error: response.error
      };
    } catch (error) {
      console.error('PayNow Error:', error);
      throw error;
    }
  }

  async checkPaymentStatus(pollUrl) {
    try {
      return await this.paynow.pollTransaction(pollUrl);
    } catch (error) {
      console.error('PayNow Status Error:', error);
      throw error;
    }
  }
}

module.exports = new PayNowService();
