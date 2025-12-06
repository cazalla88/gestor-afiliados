import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://your-domain.com'; // Replace with real domain later

    // 1. Static Routes
    const staticRoutes = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1,
        },
    ];

    // 2. Dynamic Routes (Campaigns)
    // 2. Dynamic Routes (Campaigns)
    // 2. Dynamic Routes (Campaigns)
    type SitemapCampaign = { slug: string; category: string; updatedAt: Date };
    let campaigns: SitemapCampaign[] = [];

    try {
        const dbCampaigns = await prisma.campaign.findMany({
            select: { slug: true, category: true, updatedAt: true }
        });
        // Cast category to string as default is set in DB but types might lag
        campaigns = dbCampaigns.map(c => ({
            ...c,
            category: (c as any).category || 'general'
        }));
    } catch (e) {
        console.error("Sitemap DB Error", e);
    }

    const campaignRoutes = campaigns.map((c) => ({
        url: `${baseUrl}/${c.category}/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    return [...staticRoutes, ...campaignRoutes];
}
