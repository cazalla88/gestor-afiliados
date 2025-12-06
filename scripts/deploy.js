#!/usr/bin/env node

/**
 * Quick Deploy Script
 * Automates common deploy tasks
 */

const { execSync } = require('child_process');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function exec(command, description) {
    log(`\n${description}...`, colors.blue);
    try {
        const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
        log(`✓ ${description} completed`, colors.green);
        return output;
    } catch (error) {
        log(`✗ ${description} failed: ${error.message}`, colors.red);
        throw error;
    }
}

async function deploy() {
    log('\n🚀 Starting Vercel Deployment Process\n', colors.bright);

    try {
        // Check if we're in a git repo
        exec('git status', 'Checking git status');

        // Pull latest changes
        try {
            exec('git pull', 'Pulling latest changes');
        } catch (e) {
            log('No remote changes to pull', colors.yellow);
        }

        // Build locally to catch errors
        log('\n📦 Building project locally first...', colors.blue);
        exec('npm run build', 'Local build');

        // Check Vercel CLI
        try {
            execSync('vercel --version', { stdio: 'pipe' });
        } catch (e) {
            log('\n⚠️  Vercel CLI not installed. Installing...', colors.yellow);
            exec('npm i -g vercel', 'Installing Vercel CLI');
        }

        // Login check
        try {
            execSync('vercel whoami', { stdio: 'pipe' });
            log('✓ Already logged in to Vercel', colors.green);
        } catch (e) {
            log('\n🔐 Please login to Vercel...', colors.yellow);
            execSync('vercel login', { stdio: 'inherit' });
        }

        // Deploy
        log('\n🚀 Deploying to Vercel...', colors.bright);
        const deployOutput = execSync('vercel --prod', { encoding: 'utf-8', stdio: 'inherit' });

        log('\n✅ DEPLOYMENT SUCCESSFUL!', colors.green);
        log('\n📋 Next Steps:', colors.bright);
        log('1. Check deployment at Vercel Dashboard', colors.reset);
        log('2. Verify environment variables are set', colors.reset);
        log('3. Test login at /login', colors.reset);
        log('4. Test cron endpoint manually', colors.reset);
        log('5. Update NEXT_PUBLIC_BASE_URL if domain changed\n', colors.reset);

    } catch (error) {
        log('\n❌ Deployment failed!', colors.red);
        log('Check DEPLOY.md for troubleshooting steps\n', colors.yellow);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    deploy();
}

module.exports = { deploy };
