#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 ClassInfo Notification Setup');
console.log('================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
  console.log('📝 To set up notifications, update the following variables in your .env file:\n');
} else {
  // Copy .env.example to .env
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from template');
  } else {
    console.log('❌ .env.example file not found');
    process.exit(1);
  }
}

console.log('📧 EMAIL CONFIGURATION:');
console.log('  SMTP_USER=your-email@gmail.com');
console.log('  SMTP_PASS=your-app-password');
console.log('  (For Gmail, use App Passwords: https://support.google.com/accounts/answer/185833)\n');

console.log('🔔 PUSH NOTIFICATIONS:');
console.log('  VAPID_PUBLIC_KEY=BKq2eLj8w_MEchzcSY_KysvTCu3rhXWvm9Up2C2ImOwBtqd0KWZcJAsP3H8XEFNHJXbjyFOUrQ4WMVnfCA-qh6Q');
console.log('  VAPID_PRIVATE_KEY=GwFsfbBXaxUSPIWdJwQpXI9uOzLaoMZrQQhMffx_s9Q\n');

console.log('🌐 CLIENT URL:');
console.log('  CLIENT_URL=http://localhost:5173 (for development)');
console.log('  CLIENT_URL=https://your-domain.com (for production)\n');

console.log('🔧 OPTIONAL SETUP:');
console.log('  1. Set up email service (Gmail recommended for testing)');
console.log('  2. Configure SMTP credentials');
console.log('  3. Test notifications with /api/users/test-notification endpoint\n');

console.log('🎯 NEXT STEPS:');
console.log('  1. Edit .env file with your actual credentials');
console.log('  2. Start the server: npm run dev');
console.log('  3. Test the notification system from the frontend\n');

console.log('💡 TIP: Email notifications will work without VAPID keys,');
console.log('   but push notifications require both email AND VAPID configuration.\n');
