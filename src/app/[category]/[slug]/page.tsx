import { getCampaign, getCampaignsByCategory } from "@/app/actions";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from 'next';
import BlogTemplate from '@/components/templates/BlogTemplate';
import MasterHubTemplate from '@/components/templates/MasterHubTemplate';
import LandingTemplate from '@/components/templates/LandingTemplate';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
    const { category, slug } = await params;
    const product = await getCampaign(slug);

    if (!product) {
        return {
            title: 'Product Not Found',
        };
    }

    const isBlog = product.type === 'blog';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://gestor-afiliados-web.vercel.app';
    const url = `${baseUrl}/${category}/${slug}`;

    return {
        title: isBlog
            ? `${product.title} - Honest Review & Analysis`
            : `${product.title} - Best Price & Review`,
        description: product.description.substring(0, 160),
        alternates: {
            canonical: url,
        },
        openGraph: {
            title: product.title,
            description: product.description.substring(0, 160),
            images: [product.imageUrl || ''],
            url: url,
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

export default async function DynamicCategoryPage({ params }: { params: any }) {
    const { category, slug } = await params;
    const product = await getCampaign(slug);

    if (!product) {
        notFound();
    }

    // SEO PROTECTION: Enforce Canonical URL (Silo Strictness)
    // If URL category doesn't match product's real category, 301 Redirect.
    // Example: accessing /shoes/iphone-16 -> redirects to /tech/iphone-16
    const realCategory = product.category || 'general';
    if (category !== realCategory) {
        redirect(`/${realCategory}/${slug}`);
    }

    // --- SEO: JSON-LD SCHEMA GENERATION ---
    let jsonLd = null;
    try {
        const contentStr = typeof product.content === 'string' ? product.content : JSON.stringify(product.content);
        const contentJson = contentStr ? JSON.parse(contentStr) : {};

        // Attempt to extract Rating value
        let ratingValue = 4.5; // Safe fallback
        let bestRating = 10;

        // 1. Try numeric match from "8.5/10" string in quantitativeAnalysis
        if (contentJson.quantitativeAnalysis) {
            const match = contentJson.quantitativeAnalysis.match(/(\d+(\.\d+)?)\/(\d+)/);
            if (match) {
                ratingValue = parseFloat(match[1]);
                bestRating = parseInt(match[3]);
            }
        }
        // 2. Fallback to comparison table rating if available
        else if (Array.isArray(contentJson.comparisonTable) && contentJson.comparisonTable.length > 0) {
            const selfRow = contentJson.comparisonTable.find((r: any) => r.name.includes(product.productName) || r.name === 'Este Producto');
            if (selfRow && selfRow.rating) {
                ratingValue = parseFloat(selfRow.rating);
            }
        }

        jsonLd = {
            '@context': 'https://schema.org',
            '@type': product.type === 'blog' ? 'Article' : 'Product',
            'name': product.title,
            'description': product.description,
            'image': product.imageUrl,
            'author': {
                '@type': 'Organization',
                'name': 'Gestor Afiliados Expert Team' // Customize this later
            },
            'publisher': {
                '@type': 'Organization',
                'name': 'Gestor Afiliados',
                'logo': {
                    '@type': 'ImageObject',
                    'url': 'https://gestor-afiliados-web.vercel.app/logo.png' // Ensure this exists or use a generic one
                }
            },
            'datePublished': product.createdAt,
            'dateModified': product.updatedAt,
        };

        // Enrich with Review Data if it's a product review
        if (product.type !== 'blog' || (product.type === 'blog' && ratingValue)) {
            jsonLd = {
                ...jsonLd,
                '@type': 'Product',
                'review': {
                    '@type': 'Review',
                    'reviewRating': {
                        '@type': 'Rating',
                        'ratingValue': ratingValue,
                        'bestRating': bestRating
                    },
                    'author': {
                        '@type': 'Person',
                        'name': 'Expert Reviewer'
                    }
                }
            };
        }
    } catch (e) {
        console.error("Schema Gen Error:", e);
    }
    // -------------------------------------

    // Fetch related products for internal linking
    const relatedProducts = await getCampaignsByCategory(product.category || 'general', 5);

    // 4. Render Template based on Type
    // NEW: Use MasterHubTemplate for Main Hubs strictly
    if (product.type === 'hub_principal') {
        return (
            <>
                {jsonLd && (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                    />
                )}
                <MasterHubTemplate
                    campaign={product}
                    currentSlug={slug}
                />
            </>
        );
    }

    // Existing Blog/Subhub Logic
    if (product.type === 'blog' || product.type === 'subhub') {
        return (
            <>
                {jsonLd && (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                    />
                )}
                <BlogTemplate
                    campaign={product}
                    currentSlug={slug}
                    relatedProducts={relatedProducts}
                />
            </>
        );
    }

    // Assume it's a 'landing' type if not caught above
    const isLanding = product.type === 'landing';

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            {isLanding ? (
                <LandingTemplate
                    product={product}
                    currentSlug={slug}
                    relatedProducts={relatedProducts}
                />
            ) : (
                // Fallback (should have been caught above)
                <BlogTemplate
                    campaign={product}
                    currentSlug={slug}
                    relatedProducts={relatedProducts}
                />
            )}
        </>
    );
}
