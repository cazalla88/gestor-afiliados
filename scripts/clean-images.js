#!/usr/bin/env node

/**
 * Clean orphaned images from /public/uploads/
 * Images not referenced in database are deleted
 * Run: node scripts/clean-images.js
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanOrphanedImages() {
    console.log('🧹 Starting image cleanup...\n');

    try {
        // 1. Get all campaigns with their imageUrls
        const campaigns = await prisma.campaign.findMany({
            select: { imageUrl: true }
        });

        const usedImages = new Set(
            campaigns
                .map(c => c.imageUrl)
                .filter(url => url && url.startsWith('/uploads/'))
                .map(url => url.replace('/uploads/', ''))
        );

        console.log(`📊 Found ${usedImages.size} images referenced in database`);

        // 2. Get all files in uploads directory
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

        if (!fs.existsSync(uploadsDir)) {
            console.log('✅ No uploads directory found. Nothing to clean.');
            return;
        }

        const files = fs.readdirSync(uploadsDir);
        console.log(`📁 Found ${files.length} files in uploads directory\n`);

        let deletedCount = 0;
        let deletedSize = 0;

        // 3. Delete orphaned files
        for (const file of files) {
            if (!usedImages.has(file)) {
                const filePath = path.join(uploadsDir, file);
                const stats = fs.statSync(filePath);
                deletedSize += stats.size;

                fs.unlinkSync(filePath);
                console.log(`🗑️  Deleted: ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
                deletedCount++;
            }
        }

        console.log(`\n✅ Cleanup complete!`);
        console.log(`   Deleted: ${deletedCount} files`);
        console.log(`   Freed: ${(deletedSize / 1024 / 1024).toFixed(2)} MB`);

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanOrphanedImages();
