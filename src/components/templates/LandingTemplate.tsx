import styles from "@/app/p/[slug]/page.module.css";
import Link from "next/link";
import Image from "next/image";
import ShareButtons from "@/components/ShareButtons";
import RelatedProducts from "@/components/RelatedProducts";

interface LandingTemplateProps {
    product: any;
    currentSlug: string;
    relatedProducts: any[];
}

const LABELS = {
    en: {
        buyNow: "Buy Now",
        checkPrice: "Check Price on Amazon",
        reviews: "Reviews",
        guarantee: "🔒 30-Day Money-Back Guarantee",
        whyChoose: "Why Choose",
        disclaimer: "As an Amazon Associate we earn from qualifying purchases."
    },
    es: {
        buyNow: "Comprar Ahora",
        checkPrice: "Ver Precio en Amazon",
        reviews: "Opiniones",
        guarantee: "🔒 Garantía de Devolución de 30 Días",
        whyChoose: "¿Por qué elegir",
        disclaimer: "Como Afiliado de Amazon ganamos por compras adscritas."
    }
};

export default function LandingTemplate({ product, currentSlug, relatedProducts }: LandingTemplateProps) {
    const lang = (product.language === 'es' ? 'es' : 'en') as keyof typeof LABELS;
    const t = LABELS[lang];

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
                        {t.buyNow}
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
                                ★★★★★ <span className={styles.reviewCount}>(4,892 {t.reviews})</span>
                            </div>
                            <div className={`${styles.mainDescription} animate-slide-up delay-200`} dangerouslySetInnerHTML={{ __html: product.description }} />

                            <div className={`${styles.ctaContainer} animate-slide-up delay-300`}>
                                <a href={product.affiliateLink} target="_blank" rel="noopener noreferrer" className={styles.bigBuyBtn}>
                                    {t.checkPrice}
                                </a>
                                <p className={styles.guarantee}>{t.guarantee}</p>
                            </div>
                            <ShareButtons
                                url={`https://gestor-afiliados-web.vercel.app/${product.category || 'general'}/${currentSlug}`}
                                title={product.title}
                            />
                        </div>
                    </div>
                </div>
            </header>

            <section className={styles.featuresSection}>
                <div className="container">
                    <h2 className={styles.sectionTitle}>{t.whyChoose} {product.productName}?</h2>
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
                currentSlug={currentSlug}
                category={product.category || 'general'}
                products={relatedProducts}
            />

            <footer className={styles.lpFooter}>
                <p>&copy; {new Date().getFullYear()} {product.productName} Promotions. All rights reserved.</p>
                <p className={styles.disclaimer}>{t.disclaimer}</p>
            </footer>
        </div>
    );
}
