#!/usr/bin/env node

/**
 * Clean old draft campaigns from database
 * Removes drafts older than specified days
 * Run: node scripts/clean-drafts.js [days]
 * Example: node scripts/clean-drafts.js 30
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanOldDrafts(daysOld = 30) {
    console.log(`🧹 Cleaning drafts older than ${daysOld} days...\n`);

    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        // Find drafts (campaigns with [DRAFT] in productName)
        const drafts = await prisma.campaign.findMany({
            where: {
                productName: {
                    contains: '[DRAFT]'
                },
                createdAt: {
                    lt: cutoffDate
                }
            },
            select: {
                slug: true,
                productName: true,
                createdAt: true
            }
        });

        console.log(`📊 Found ${drafts.length} old drafts to delete:\n`);

        if (drafts.length === 0) {
            console.log('✅ No old drafts found. Database is clean!');
            return;
        }

        // Display drafts
        drafts.forEach(draft => {
            const age = Math.floor((Date.now() - new Date(draft.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            console.log(`   • ${draft.productName}`);
            console.log(`     Age: ${age} days | Slug: ${draft.slug}\n`);
        });

        // Delete them
        const result = await prisma.campaign.deleteMany({
            where: {
                productName: {
                    contains: '[DRAFT]'
                },
                createdAt: {
                    lt: cutoffDate
                }
            }
        });

        console.log(`✅ Deleted ${result.count} old drafts successfully!`);
        console.log(`💡 Tip: Run this monthly to keep database clean\n`);

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Get days from command line argument, default to 30
const daysArg = process.argv[2];
const days = daysArg ? parseInt(daysArg, 10) : 30;

if (isNaN(days) || days < 1) {
    console.error('❌ Invalid number of days. Usage: node clean-drafts.js [days]');
    process.exit(1);
}

cleanOldDrafts(days);
