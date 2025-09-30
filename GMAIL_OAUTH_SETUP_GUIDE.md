# Gmail OAuth Setup Guide for Vidyaastra Payment System

## 🚨 Current Issue: Missing client_id Parameter

The error you're seeing:
```
Access blocked: Authorization Error
Missing required parameter: client_id
Error 400: invalid_request
```

This happens because the `GOOGLE_CLIENT_ID` environment variable is not set in your system.

## 🔧 Complete Setup Instructions

### Step 1: Create .env File

Create a file named `.env` in your `vidyaastraaws` directory with the following content:

```env
# Gmail OAuth Configuration (Required for Payment System)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/payment-system/oauth/callback

# Encryption Key for sensitive data
ENCRYPTION_KEY=your_encryption_key_here

# Existing MongoDB and other configurations
MONGODB_URI=mongodb://localhost:27017/vidyaastra
JWT_SECRET=your_jwt_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_REGION=us-east-1

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com
COMPANY_NAME=Vidyaastra
CONTACT_EMAIL=contact@vidyaastra.com
ADMIN_EMAIL=admin@vidyaastra.com
ENABLE_EMAILS=true

# Server Configuration
PORT=5000
NODE_ENV=development
MAX_FILE_UPLOAD=100000000
FILE_UPLOAD_PATH=uploads/files
```

### Step 2: Google Cloud Console Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create/Select Project**: 
   - Click "Select a project" → "New Project"
   - Name: "Vidyaastra Payment System"
   - Click "Create"

3. **Enable Gmail API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Name: "Vidyaastra Payment System"
   - Add authorized redirect URIs:
     - `http://localhost:5000/api/payment-system/oauth/callback`
     - `https://yourdomain.com/api/payment-system/oauth/callback` (for production)
   - Click "Create"

5. **Download Credentials**:
   - Click the download button (⬇️) next to your OAuth client
   - Save the JSON file
   - Copy the `client_id` and `client_secret` values

### Step 3: Update .env File

Replace the placeholder values in your `.env` file:

```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
ENCRYPTION_KEY=your_random_32_character_string_here
```

### Step 4: Test the Configuration

Run the test script to verify everything is working:

```bash
cd vidyaastraaws
node test-gmail-oauth.js
```

You should see:
```
✅ Gmail OAuth configuration is working correctly!
```

### Step 5: Complete OAuth Flow

1. **Start your server**:
   ```bash
   npm start
   ```

2. **Access the OAuth URL**:
   - Go to: `http://localhost:5000/api/payment-system/oauth/url?schoolId=your_school_id`
   - This will return an OAuth URL

3. **Authorize Gmail Access**:
   - Open the OAuth URL in your browser
   - Sign in with the Gmail account you want to use for payment verification
   - Grant permissions for Gmail access
   - You'll be redirected back to your application

4. **Verify Setup**:
   - Check your server logs for "Gmail credentials configured successfully"
   - The system will now automatically verify payments via email

## 🔄 How Email Verification Works

1. **Student makes UPI payment** → UPI app sends confirmation email
2. **Cron job runs every 2 minutes** → Checks Gmail for new payment emails
3. **Email parsing service** → Extracts transaction details from emails
4. **Payment matching** → Matches transaction with pending payments
5. **Status update** → Updates payment status to "paid"

## 🧪 Testing the Complete Flow

1. **Create a test payment**:
   ```bash
   curl -X POST http://localhost:5000/api/payment-system/fees/initiate \
     -H "Content-Type: application/json" \
     -d '{
       "studentId": "student_id",
       "schoolId": "school_id",
       "feeId": "fee_id",
       "installmentIndex": 0,
       "amount": 1000
     }'
   ```

2. **Make a test UPI payment** using the QR code or UPI ID

3. **Check payment status**:
   ```bash
   curl http://localhost:5000/api/payment-system/fees/status/payment_id
   ```

## 🚨 Troubleshooting

### Common Issues:

1. **"Missing required parameter: client_id"**
   - Solution: Set `GOOGLE_CLIENT_ID` in your `.env` file

2. **"Invalid redirect URI"**
   - Solution: Add the exact redirect URI to Google Cloud Console

3. **"Gmail API not enabled"**
   - Solution: Enable Gmail API in Google Cloud Console

4. **"Token expired"**
   - Solution: The system automatically refreshes tokens

### Debug Commands:

```bash
# Test OAuth configuration
node test-gmail-oauth.js

# Test payment system
node test-payment-system.js

# Check server logs
tail -f logs/app.log
```

## 📞 Support

If you're still having issues:

1. Check the server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure Gmail API is enabled in Google Cloud Console
4. Test with the provided test scripts

## 🎯 Expected Result

Once properly configured, your payment system will:
- ✅ Generate OAuth URLs with proper client_id
- ✅ Allow Gmail authorization
- ✅ Automatically verify payments via email
- ✅ Update payment status in real-time
- ✅ Work seamlessly with your React Native app

The error you're seeing will be completely resolved once you complete this setup!
