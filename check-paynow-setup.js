const fs = require('fs');
const path = require('path');

console.log('Ì¥ç Checking PayNow setup...\n');

// 1. Check if PayNowTransaction model exists
const modelPath = path.join(__dirname, 'models', 'PayNowTransaction.js');
if (fs.existsSync(modelPath)) {
  console.log('‚úÖ models/PayNowTransaction.js exists');
} else {
  console.log('‚ùå models/PayNowTransaction.js MISSING!');
  console.log('   You need to create this model file.');
}

// 2. Check controller import
const controllerPath = path.join(__dirname, 'controllers', 'paynowController.js');
if (fs.existsSync(controllerPath)) {
  const controllerContent = fs.readFileSync(controllerPath, 'utf8');
  
  if (controllerContent.includes('require(\'../models/PayNowTransaction\')') || 
      controllerContent.includes("require('../models/PayNowTransaction')")) {
    console.log('‚úÖ PayNowTransaction import found in controller');
  } else {
    console.log('‚ùå PayNowTransaction import MISSING in controller!');
    console.log('   Add: const PayNowTransaction = require(\'../models/PayNowTransaction\');');
  }
  
  // Check if getAllTransactions method exists
  if (controllerContent.includes('getAllTransactions')) {
    console.log('‚úÖ getAllTransactions method exists');
  } else {
    console.log('‚ùå getAllTransactions method MISSING!');
  }
} else {
  console.log('‚ùå controllers/paynowController.js MISSING!');
}

// 3. Check service file
const servicePath = path.join(__dirname, 'services', 'paynowService.js');
if (fs.existsSync(servicePath)) {
  console.log('‚úÖ services/paynowService.js exists');
} else {
  console.log('‚ùå services/paynowService.js MISSING!');
}

console.log('\nÌ≤° If any files are missing, create them from the previous instructions.');
