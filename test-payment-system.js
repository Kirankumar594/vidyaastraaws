const axios = require('axios');

// Test configuration
const BASE_URL = 'https://vidyaastra.com';
const TEST_SCHOOL_ID = 'test_school_id'; // Replace with actual school ID
const TEST_STUDENT_ID = 'test_student_id'; // Replace with actual student ID
const TEST_FEE_ID = 'test_fee_id'; // Replace with actual fee ID

class PaymentSystemTester {
  constructor() {
    this.baseURL = BASE_URL;
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Payment System Integration Tests...\n');

    try {
      // Test 1: Payment Settings CRUD
      await this.testPaymentSettings();

      // Test 2: Fee Payment Initiation
      await this.testFeePaymentInitiation();

      // Test 3: Payment Status Check
      await this.testPaymentStatusCheck();

      // Test 4: Payment Verification
      await this.testPaymentVerification();

      // Test 5: Gmail OAuth Flow
      await this.testGmailOAuth();

      // Test 6: Statistics
      await this.testPaymentStatistics();

      this.printTestResults();
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
    }
  }

  async testPaymentSettings() {
    console.log('📋 Testing Payment Settings...');
    
    try {
      // Test GET payment settings
      const getResponse = await axios.get(`${this.baseURL}/api/payment-system/settings?schoolId=${TEST_SCHOOL_ID}`);
      this.addTestResult('GET Payment Settings', getResponse.status === 200, getResponse.data);

      // Test POST payment settings (create/update)
      const formData = new FormData();
      formData.append('schoolId', TEST_SCHOOL_ID);
      formData.append('upiId', 'test@paytm');
      
      const postResponse = await axios.post(`${this.baseURL}/api/payment-system/settings`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      this.addTestResult('POST Payment Settings', postResponse.status === 200, postResponse.data);

    } catch (error) {
      this.addTestResult('Payment Settings', false, error.response?.data || error.message);
    }
  }

  async testFeePaymentInitiation() {
    console.log('💰 Testing Fee Payment Initiation...');
    
    try {
      const paymentData = {
        studentId: TEST_STUDENT_ID,
        schoolId: TEST_SCHOOL_ID,
        feeId: TEST_FEE_ID,
        installmentIndex: 0,
        amount: 1000
      };

      const response = await axios.post(`${this.baseURL}/api/payment-system/fees/initiate`, paymentData);
      this.addTestResult('Initiate Fee Payment', response.status === 201, response.data);

      // Store payment ID for later tests
      if (response.data.success) {
        this.paymentId = response.data.data.paymentId;
      }

    } catch (error) {
      this.addTestResult('Fee Payment Initiation', false, error.response?.data || error.message);
    }
  }

  async testPaymentStatusCheck() {
    console.log('📊 Testing Payment Status Check...');
    
    if (!this.paymentId) {
      this.addTestResult('Payment Status Check', false, 'No payment ID available');
      return;
    }

    try {
      const response = await axios.get(`${this.baseURL}/api/payment-system/fees/status/${this.paymentId}`);
      this.addTestResult('Payment Status Check', response.status === 200, response.data);

    } catch (error) {
      this.addTestResult('Payment Status Check', false, error.response?.data || error.message);
    }
  }

  async testPaymentVerification() {
    console.log('✅ Testing Payment Verification...');
    
    try {
      const verificationData = {
        schoolId: TEST_SCHOOL_ID,
        rawEmailData: 'Test email content with payment details',
        transactionId: 'TXN123456789',
        amount: 1000,
        payerUpi: 'student@paytm',
        emailSubject: 'Payment Received',
        emailFrom: 'noreply@paytm.com',
        emailDate: new Date().toISOString()
      };

      const response = await axios.post(`${this.baseURL}/api/payment-system/verify`, verificationData);
      this.addTestResult('Payment Verification', response.status === 200, response.data);

    } catch (error) {
      this.addTestResult('Payment Verification', false, error.response?.data || error.message);
    }
  }

  async testGmailOAuth() {
    console.log('📧 Testing Gmail OAuth...');
    
    try {
      // Test OAuth URL generation
      const response = await axios.get(`${this.baseURL}/api/payment-system/oauth/url?schoolId=${TEST_SCHOOL_ID}`);
      this.addTestResult('Gmail OAuth URL', response.status === 200, response.data);

      // Test manual verification trigger
      const triggerResponse = await axios.post(`${this.baseURL}/api/payment-system/verify/manual`, {
        schoolId: TEST_SCHOOL_ID
      });
      this.addTestResult('Manual Verification Trigger', triggerResponse.status === 200, triggerResponse.data);

    } catch (error) {
      this.addTestResult('Gmail OAuth', false, error.response?.data || error.message);
    }
  }

  async testPaymentStatistics() {
    console.log('📈 Testing Payment Statistics...');
    
    try {
      const response = await axios.get(`${this.baseURL}/api/payment-system/statistics?schoolId=${TEST_SCHOOL_ID}`);
      this.addTestResult('Payment Statistics', response.status === 200, response.data);

    } catch (error) {
      this.addTestResult('Payment Statistics', false, error.response?.data || error.message);
    }
  }

  addTestResult(testName, passed, data) {
    this.testResults.push({
      name: testName,
      passed,
      data: data
    });
    
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${testName}`);
  }

  printTestResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} - ${result.name}`);
      
      if (!result.passed && result.data) {
        console.log(`    Error: ${JSON.stringify(result.data)}`);
      }
    });
    
    console.log('='.repeat(50));
    console.log(`Total: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Payment system is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please check the implementation.');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new PaymentSystemTester();
  tester.runAllTests();
}

module.exports = PaymentSystemTester;

