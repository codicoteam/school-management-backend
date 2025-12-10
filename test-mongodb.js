const mongoose = require('mongoose');
require('dotenv').config();

console.log('Ì¥ç Testing MongoDB Atlas Connection...');
console.log('Connection string:', process.env.MONGODB_URI ? 'Present' : 'Missing');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000
})
.then(() => {
  console.log('‚úÖ SUCCESS: MongoDB Connected!');
  console.log('Host:', mongoose.connection.host);
  process.exit(0);
})
.catch(err => {
  console.error('‚ùå FAILED:', err.message);
  console.log('\nÌ≤° Troubleshooting:');
  console.log('1. Go to https://cloud.mongodb.com/');
  console.log('2. Click "Network Access"');
  console.log('3. Add your IP address or use 0.0.0.0/0 (allow all)');
  console.log('4. Wait 1-2 minutes for changes to apply');
  process.exit(1);
});
