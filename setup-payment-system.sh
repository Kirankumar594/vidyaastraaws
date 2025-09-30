#!/bin/bash

# Payment System Environment Setup Script
echo "🚀 Setting up Payment System Environment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Creating template..."
    cat > .env << EOF
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/schoolmanagement

# Server Configuration
PORT=5000
NODE_ENV=development

# Gmail OAuth Configuration (Required for Payment System)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/payment-system/oauth/callback

# Encryption Key for sensitive data (Required for Payment System)
ENCRYPTION_KEY=your_32_character_encryption_key_here

# AWS Configuration (if using S3)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_REGION=your_region

# JWT Secret
JWT_SECRET=your_jwt_secret_here
EOF
    echo "✅ .env template created. Please update with your actual values."
else
    echo "✅ .env file exists."
fi

# Install required dependencies
echo "📦 Installing payment system dependencies..."
npm install googleapis node-cron crypto

# Create uploads directory for QR codes
echo "📁 Creating uploads directory..."
mkdir -p uploads/payment-qr

# Set proper permissions
chmod 755 uploads/payment-qr

echo "✅ Environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your actual values"
echo "2. Set up Google Cloud Console OAuth credentials"
echo "3. Run: npm start"
echo "4. Test the payment system with: node test-payment-system.js"
echo ""
echo "🔗 Google Cloud Console Setup:"
echo "1. Go to https://console.cloud.google.com/"
echo "2. Create/select a project"
echo "3. Enable Gmail API"
echo "4. Create OAuth 2.0 credentials"
echo "5. Add authorized redirect URI: http://localhost:5000/api/payment-system/oauth/callback"
echo "6. Download credentials and update .env file"
echo ""
echo "🎉 Payment system is ready to use!"

