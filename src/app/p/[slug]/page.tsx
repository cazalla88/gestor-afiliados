import { getCampaign } from "@/app/actions";
import { notFound, redirect, permanentRedirect } from "next/navigation";
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const product = await getCampaign(slug);

    if (!product) {
        return { title: 'Product Not Found' };
    }

    return {
        title: product.title,
        description: product.description.substring(0, 160),
    };
}

export default async function ProductLandingPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const product = await getCampaign(slug);

    if (!product) {
        notFound();
    }

    // Redirect to new SEO Silo structure
    // We cast category to string because Prisma might haven't updated types yet in IDE context
    const category = (product as any).category || 'general';
    permanentRedirect(`/${category}/${slug}`);
}
