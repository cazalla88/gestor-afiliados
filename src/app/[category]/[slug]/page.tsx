"use server";

import { getCampaign, getCampaignsByCategory } from "@/app/actions";
import { notFound } from "next/navigation";
import type { Metadata } from 'next';
import LandingTemplate from "@/components/templates/LandingTemplate";
import BlogTemplate from "@/components/templates/BlogTemplate";

export async function generateMetadata({ params }: { params: Promise<{ category: string, slug: string }> }): Promise<Metadata> {
    const { category, slug } = await params;
    const product = await getCampaign(slug);

    if (!product) {
        return {
            title: 'Product Not Found',
        };
    }

    const isBlog = product.type === 'blog';

    return {
        title: isBlog
            ? `${product.title} - Honest Review & Analysis`
            : `${product.title} - Best Price & Review`,
        description: product.description.substring(0, 160),
        openGraph: {
            title: product.title,
            description: product.description.substring(0, 160),
            images: [product.imageUrl || ''],
            url: `https://gestor-afiliados-web.vercel.app/${category}/${slug}`,
            type: isBlog ? 'article' : 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: product.title,
            description: product.description.substring(0, 160),
            images: [product.imageUrl || ''],
        },
    };
}


export default async function DynamicCategoryPage({ params }: { params: Promise<{ category: string, slug: string }> }) {
    const { category, slug } = await params;
    const product = await getCampaign(slug);

    if (!product) {
        notFound();
    }

    // Validate category matches (optional: redirect if incorrect category but correct slug)
    // if (product.category !== category) { ... }

    // Fetch related products for internal linking
    const relatedProducts = await getCampaignsByCategory(product.category || 'general', 5);

    if (product.type === 'blog') {
        return (
            <BlogTemplate
                campaign={product}
                currentSlug={slug}
                relatedProducts={relatedProducts}
            />
        );
    }

    return (
        <LandingTemplate
            product={product}
            currentSlug={slug}
            relatedProducts={relatedProducts}
        />
    );
}
