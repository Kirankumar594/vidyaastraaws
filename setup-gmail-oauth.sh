#!/bin/bash

echo "🚀 Vidyaastra Payment System - Gmail OAuth Setup"
echo "================================================"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp env-template.txt .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit the .env file and add your actual credentials:"
    echo "   - GOOGLE_CLIENT_ID (from Google Cloud Console)"
    echo "   - GOOGLE_CLIENT_SECRET (from Google Cloud Console)"
    echo "   - ENCRYPTION_KEY (generate a random string)"
    echo "   - Other required variables"
    echo ""
    echo "📖 Instructions:"
    echo "1. Go to https://console.cloud.google.com/"
    echo "2. Create/select a project"
    echo "3. Enable Gmail API"
    echo "4. Create OAuth 2.0 credentials"
    echo "5. Add redirect URI: http://localhost:5000/api/payment-system/oauth/callback"
    echo "6. Copy client ID and secret to .env file"
    echo ""
else
    echo "✅ .env file already exists"
fi

# Check if required packages are installed
echo "📦 Checking dependencies..."
if ! npm list googleapis > /dev/null 2>&1; then
    echo "Installing googleapis..."
    npm install googleapis
fi

if ! npm list node-cron > /dev/null 2>&1; then
    echo "Installing node-cron..."
    npm install node-cron
fi

echo "✅ Dependencies checked"
echo ""

# Test the OAuth configuration
echo "🧪 Testing Gmail OAuth configuration..."
node test-gmail-oauth.js

echo ""
echo "🎯 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Complete the Google Cloud Console setup"
echo "2. Update your .env file with actual credentials"
echo "3. Run: node test-gmail-oauth.js"
echo "4. Follow the OAuth URL to authorize Gmail access"
echo "5. Your payment verification system will be ready!"
echo ""
echo "📚 For detailed instructions, see PAYMENT_SYSTEM_README.md"
