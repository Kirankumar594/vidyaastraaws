const mongoose = require('mongoose');
const FeePayment = require('./models/FeePayment');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/schoolmanagement', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function clearPendingPayments() {
  try {
    console.log('Clearing pending payments...');
    
    const schoolId = '68c56c593e7e1d55d5f8016f';
    const studentId = '68d6582d1bc97f754aab08f8';
    
    // Delete pending payments for this student
    const result = await FeePayment.deleteMany({
      schoolId,
      studentId,
      status: 'pending'
    });
    
    console.log(`✅ Cleared ${result.deletedCount} pending payments`);
    console.log('✅ You can now test the payment flow again!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing payments:', error);
    process.exit(1);
  }
}

clearPendingPayments();
