#!/usr/bin/env node

/**
 * Script to generate secure secrets for production
 * Run: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

function generateSecret(length = 32) {
    return crypto.randomBytes(length).toString('base64');
}

function generatePassword(length = 16) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }
    return password;
}

console.log('🔐 AFFILIATENEXUS - SECURE SECRETS GENERATOR\n');
console.log('Copy these to your .env file:\n');
console.log('=====================================');
console.log(`ADMIN_PASSWORD="${generatePassword(20)}"`);
console.log(`NEXTAUTH_SECRET="${generateSecret(32)}"`);
console.log(`CRON_SECRET="${generateSecret(24)}"`);
console.log('=====================================\n');
console.log('⚠️  IMPORTANT: Store these securely and never commit to git!\n');
