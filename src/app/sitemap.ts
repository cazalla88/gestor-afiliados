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
    let campaigns: { slug: string; type: string; updatedAt: Date }[] = [];
    try {
        campaigns = await prisma.campaign.findMany({
            select: { slug: true, type: true, updatedAt: true }
        });
    } catch (e) {
        console.error("Sitemap DB Error", e);
    }

    const campaignRoutes = campaigns.map((c) => ({
        url: `${baseUrl}/${c.type === 'landing' ? 'p' : 'blog'}/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    return [...staticRoutes, ...campaignRoutes];
}
