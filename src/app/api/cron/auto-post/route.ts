import { NextRequest, NextResponse } from "next/server";
import { analyzeTrends, generateSeoContent, createCampaign } from "@/app/actions";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    // Rate limiting: 5 requests per hour per IP
    const identifier = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = rateLimit(identifier, 5, 60 * 60 * 1000);

    if (!rateLimitResult.allowed) {
        return NextResponse.json(
            { error: 'Rate limit exceeded. Try again later.' },
            {
                status: 429,
                headers: getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.resetAt)
            }
        );
    }

    // Secret key protection
    const validKey = process.env.CRON_SECRET || "cron123";

    if (key !== validKey) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = ["Smart Home", "Fitness", "Pets", "Office", "Travel"];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

    if (!apiKey) return NextResponse.json({ error: 'No API Key configured' });

    try {
        // 1. Find Trend
        const trends = await analyzeTrends(randomCategory, 'en', apiKey);

        if (trends.error || !trends.trends || trends.trends.length === 0) {
            return NextResponse.json({ error: 'No trends found', details: trends });
        }

        const topTrend = trends.trends[0];
        const productName = topTrend.suggestedProduct;

        // 2. Generate Content
        const content = await generateSeoContent(
            productName,
            `Trending product in ${randomCategory}. Reason: ${topTrend.reason}. Niche: ${topTrend.nicheTitle}`,
            apiKey,
            'blog',
            'en'
        );

        if (content.error) return NextResponse.json({ error: content.error });

        // 3. Save as Draft
        const slug = `draft-${productName.toLowerCase().slice(0, 30).replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

        const res = await createCampaign({
            id: slug,
            type: 'blog',
            category: randomCategory.toLowerCase().replace(' ', '-'),
            language: 'en',
            productName: `[DRAFT] ${productName}`,
            title: content.title || productName,
            description: content.introduction || "Auto-generated draft",
            affiliateLink: "https://amazon.com",
            imageUrl: "",
            ...content
        });

        if (res.error) return NextResponse.json({ error: res.error });

        return NextResponse.json({
            success: true,
            created: slug,
            trend: topTrend.nicheTitle,
            category: randomCategory,
            rateLimitRemaining: rateLimitResult.remaining
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
