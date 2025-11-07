const GmailOAuthService = require('./services/gmailOAuthService');
const mongoose = require('mongoose');
require('dotenv').config();

async function testGmailOAuth() {
  console.log('🧪 Testing Gmail OAuth Configuration...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables Check:');
  console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
  console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
  console.log('GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI || 'Using default');
  console.log('ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY ? '✅ Set' : '❌ Missing');
  console.log('');

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log('❌ Missing required environment variables!');
    console.log('Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file');
    return;
  }

  try {
    // Test OAuth service initialization
    console.log('🔧 Initializing Gmail OAuth Service...');
    const gmailOAuthService = new GmailOAuthService();
    console.log('✅ Gmail OAuth Service initialized successfully');

    // Test OAuth URL generation
    console.log('\n🔗 Testing OAuth URL generation...');
    const testSchoolId = 'test-school-123';
    const { authUrl, state } = gmailOAuthService.generateAuthUrl(testSchoolId);
    
    console.log('✅ OAuth URL generated successfully');
    console.log('Auth URL:', authUrl);
    console.log('State:', state);
    
    // Validate URL contains required parameters
    const url = new URL(authUrl);
    const params = url.searchParams;
    
    console.log('\n📊 OAuth URL Parameters:');
    console.log('client_id:', params.get('client_id') ? '✅ Present' : '❌ Missing');
    console.log('redirect_uri:', params.get('redirect_uri') ? '✅ Present' : '❌ Missing');
    console.log('response_type:', params.get('response_type') ? '✅ Present' : '❌ Missing');
    console.log('scope:', params.get('scope') ? '✅ Present' : '❌ Missing');
    console.log('access_type:', params.get('access_type') ? '✅ Present' : '❌ Missing');
    console.log('state:', params.get('state') ? '✅ Present' : '❌ Missing');

    if (!params.get('client_id')) {
      console.log('\n❌ ERROR: client_id is missing from OAuth URL!');
      console.log('This means GOOGLE_CLIENT_ID environment variable is not set correctly.');
      return;
    }

    console.log('\n✅ Gmail OAuth configuration is working correctly!');
    console.log('\n📝 Next Steps:');
    console.log('1. Copy the Auth URL above and open it in your browser');
    console.log('2. Complete the OAuth authorization flow');
    console.log('3. The system will automatically configure Gmail credentials');
    console.log('4. Payment verification will start working automatically');

  } catch (error) {
    console.log('❌ Error testing Gmail OAuth:', error.message);
    console.log('Stack trace:', error.stack);
  }
}

// Run the test
testGmailOAuth().catch(console.error);

