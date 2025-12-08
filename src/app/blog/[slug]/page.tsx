import { getCampaign } from "@/app/actions";
import { notFound, redirect, permanentRedirect } from "next/navigation";
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
    const { slug } = await params;
    const campaign = await getCampaign(slug);

    if (!campaign) {
        return { title: 'Blog Post Not Found' };
    }

    return {
        title: campaign.title,
        description: campaign.description.substring(0, 160),
    };
}

export default async function BlogPostPage({ params }: { params: any }) {
    const { slug } = await params;
    const campaign = await getCampaign(slug);

    if (!campaign) {
        notFound();
    }

    // Redirect to new SEO Silo structure
    const category = (campaign as any).category || 'general';
    permanentRedirect(`/${category}/${slug}`);
}
