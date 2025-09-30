const mongoose = require('mongoose');
const PaymentSettings = require('./models/PaymentSettings');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/schoolmanagement', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function setupTestPaymentSettings() {
  try {
    console.log('Setting up test payment settings...');
    
    const schoolId = '68c56c593e7e1d55d5f8016f'; // Your school ID from the logs
    
    // Create or update payment settings
    const paymentSettings = await PaymentSettings.findOneAndUpdate(
      { schoolId },
      {
        schoolId,
        upiId: 'test@paytm', // Test UPI ID
        qrCodeUrl: null, // No QR code for now
        gmailCredentials: {
          accessToken: null,
          refreshToken: null,
          tokenExpiry: null,
          email: null
        }
      },
      { upsert: true, new: true }
    );
    
    console.log('✅ Payment settings created/updated:', paymentSettings);
    console.log('✅ UPI ID set to: test@paytm');
    console.log('✅ You can now test the payment flow!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up payment settings:', error);
    process.exit(1);
  }
}

setupTestPaymentSettings();
