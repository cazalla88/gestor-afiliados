"use server";

import { getCampaign } from "@/app/actions";
import styles from "./page.module.css";
import Link from "next/link";
import Image from "next/image";
import ShareButtons from "@/components/ShareButtons";
import RelatedProducts from "@/components/RelatedProducts";
import { notFound } from "next/navigation";
import type { Metadata } from 'next';
import { getCampaignsByCategory } from "@/app/actions";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const product = await getCampaign(slug);

    if (!product) {
        return {
            title: 'Product Not Found',
        };
    }

    return {
        title: `${product.title} - Best Price & Review`,
        description: product.description.substring(0, 160),
        openGraph: {
            title: product.title,
            description: product.description.substring(0, 160),
            images: [product.imageUrl || ''],
            url: `https://gestor-afiliados-web.vercel.app/p/${slug}`,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: product.title,
            description: product.description.substring(0, 160),
            images: [product.imageUrl || ''],
        },
    };
}


export default async function ProductLandingPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const product = await getCampaign(slug);

    if (!product) {
        notFound();
    }

    // Fetch related products for internal linking
    const relatedProducts = await getCampaignsByCategory(product.category || 'general', 5);

    const jsonLd = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.productName,
        "image": product.imageUrl,
        "description": product.description,
        "review": {
            "@type": "Review",
            "reviewRating": {
                "@type": "Rating",
                "ratingValue": "5",
                "bestRating": "5"
            },
            "author": {
                "@type": "Person",
                "name": "AffiliateNexus Editor"
            }
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "124"
        }
    };

    return (
        <div className={styles.lpContainer}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <nav className={styles.lpNav}>
                <div className="container">
                    <span className={styles.brand}>{product.productName}</span>
                    <a href={product.affiliateLink} target="_blank" rel="noopener noreferrer" className={styles.buyBtnNav}>
                        Buy Now
                    </a>
                </div>
            </nav>

            <header className={styles.lpHero}>
                <div className="container">
                    <div className={styles.heroGrid}>
                        <div className={`${styles.imageWrapper} animate-fade-in`}>
                            <Image
                                src={product.imageUrl || "https://placehold.co/600x400/121212/FFF?text=Product+Image"}
                                alt={product.productName}
                                width={600}
                                height={400}
                                className={styles.productImage}
                                priority
                            />
                        </div>
                        <div className={styles.contentWrapper}>
                            <h1 className={`${styles.productTitle} animate-slide-up delay-100`}>{product.title}</h1>
                            <div className={`${styles.rating} animate-slide-up delay-200`}>
                                ★★★★★ <span className={styles.reviewCount}>(4,892 Reviews)</span>
                            </div>
                            <div className={`${styles.mainDescription} animate-slide-up delay-200`} dangerouslySetInnerHTML={{ __html: product.description }} />

                            <div className={`${styles.ctaContainer} animate-slide-up delay-300`}>
                                <a href={product.affiliateLink} target="_blank" rel="noopener noreferrer" className={styles.bigBuyBtn}>
                                    Check Price on Amazon
                                </a>
                                <p className={styles.guarantee}>🔒 30-Day Money-Back Guarantee</p>
                            </div>
                            <ShareButtons
                                url={`https://gestor-afiliados-web.vercel.app/p/${slug}`}
                                title={product.title}
                            />
                        </div>
                    </div>
                </div>
            </header>

            <section className={styles.featuresSection}>
                <div className="container">
                    <h2 className={styles.sectionTitle}>Why Choose {product.productName}?</h2>
                    <div className={styles.featuresGrid}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className={styles.featureCard}>
                                <h3>Premium Feature {i}</h3>
                                <p>This product comes with outstanding capabilities that outperform the competition in every way.</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <RelatedProducts
                currentSlug={slug}
                category={product.category || 'general'}
                products={relatedProducts}
            />

            <footer className={styles.lpFooter}>
                <p>&copy; {new Date().getFullYear()} {product.productName} Promotions. All rights reserved.</p>
                <p className={styles.disclaimer}>As an Amazon Associate we earn from qualifying purchases.</p>
            </footer>
        </div>
    );
}
