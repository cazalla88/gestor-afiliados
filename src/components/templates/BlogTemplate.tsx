import styles from "@/app/blog/[slug]/page.module.css";
import Link from "next/link";
import Image from "next/image";
import RelatedProducts from "@/components/RelatedProducts";

interface BlogTemplateProps {
    campaign: any;
    currentSlug: string;
    relatedProducts: any[];
}

const LABELS = {
    en: {
        review: "Review",
        by: "By",
        whoFor: "🎯 Who is this for?",
        score: "📊 Performance Score",
        features: "Main Features",
        pros: "✅ The Good",
        cons: "❌ The Bad",
        comparison: "Comparison vs Competitors",
        verdict: "Final Verdict",
        checkPrice: "Check Best Price for",
        buyNow: "Buy Now",
        product: "Product",
        price: "Price",
        rating: "Rating",
        mainFeature: "Main Feature"
    },
    es: {
        review: "Análisis",
        by: "Por",
        whoFor: "🎯 ¿Para quién es esto?",
        score: "📊 Puntuación",
        features: "Características Principales",
        pros: "✅ Lo Bueno",
        cons: "❌ Lo Malo",
        comparison: "Comparativa vs Competidores",
        verdict: "Veredicto Final",
        checkPrice: "Ver Mejor Precio para",
        buyNow: "Comprar Ahora",
        product: "Producto",
        price: "Precio",
        rating: "Valoración",
        mainFeature: "Característica"
    }
};

export default function BlogTemplate({ campaign, currentSlug, relatedProducts }: BlogTemplateProps) {
    const lang = (campaign.language === 'es' ? 'es' : 'en') as keyof typeof LABELS;
    const t = LABELS[lang];

    // Parse structured content JSON
    let content: any = {};
    try {
        content = campaign.content ? JSON.parse(campaign.content) : {};
    } catch (e) {
        console.error("Error parsing content JSON", e);
    }

    const date = new Date(campaign.createdAt).toLocaleDateString(lang === 'es' ? "es-ES" : "en-US", { year: 'numeric', month: 'long', day: 'numeric' });

    const jsonLd = { /* ... keep jsonLd same ... */ }; // Simplify for brevity in this replace call if possible, acts as context

    const jsonLdFull = {
        "@context": "https://schema.org/",
        "@type": "Review",
        "itemReviewed": {
            "@type": "Product",
            "name": campaign.productName,
            "image": campaign.imageUrl,
            "description": campaign.description
        },
        "author": {
            "@type": "Person",
            "name": "AffiliateNexus Editor"
        },
        "reviewRating": {
            "@type": "Rating",
            "ratingValue": "4.5",
            "bestRating": "5"
        },
        "publisher": {
            "@type": "Organization",
            "name": "AffiliateNexus"
        },
        "datePublished": campaign.createdAt
    };

    return (
        <article className={styles.articleContainer}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFull) }}
            />
            {/* NEW SPLIT HERO SECTION */}
            <section className={styles.heroSection}>
                <div className="container">
                    <div className={styles.heroGrid}>
                        {/* LEFT: IMAGE */}
                        <div className={styles.heroImageWrapper} style={{ position: 'relative', minHeight: '400px', width: '100%' }}>
                            <Image
                                src={campaign.imageUrl || "https://placehold.co/600x600/222/FFF?text=Product+Image"}
                                alt={campaign.productName}
                                fill
                                style={{ objectFit: 'contain' }}
                                className={styles.heroImage}
                                priority
                                sizes="(max-width: 768px) 100vw, 500px"
                            />
                        </div>

                        {/* RIGHT: CONTENT */}
                        <div className={styles.heroContent}>
                            <div className={styles.meta} style={{ justifyContent: 'flex-start', marginBottom: 0 }}>
                                <span className={styles.heroCategory}>{t.review}</span>
                                <span style={{ margin: '0 0.5rem', color: '#ccc' }}>|</span>
                                <span className={styles.date}>{date}</span>
                            </div>

                            <h1 className={styles.heroTitle}>{campaign.title}</h1>

                            <div className={styles.author} style={{ justifyContent: 'flex-start' }}>
                                <div className={styles.avatar}>A</div>
                                <span>{t.by} <strong>AffiliateNexus Editor</strong></span>
                            </div>

                            <p className={styles.heroDescription}>
                                {campaign.description}
                            </p>

                            <a href={campaign.affiliateLink} target="_blank" rel="noopener noreferrer" className={styles.heroCta}>
                                {lang === 'es' ? 'Ver Oferta en Amazon 🛒' : 'Check Price on Amazon 🛒'}
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <div className={`container ${styles.contentGrid}`}>
                <div className={styles.mainContent}>
                    {/* Intro Section - Hide if identical to Hero Description to avoid duplication */}
                    {content.introduction && content.introduction.trim() !== (campaign.description || "").trim() && (
                        <section className={styles.intro}>
                            <div dangerouslySetInnerHTML={{ __html: content.introduction }} />
                        </section>
                    )}

                    {content.targetAudience && (
                        <section className={styles.features} style={{ backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #2563eb' }}>
                            <h3 style={{ marginTop: 0, color: '#111' }}>{t.whoFor}</h3>
                            <p style={{ marginBottom: 0, color: '#444' }}>{content.targetAudience}</p>
                        </section>
                    )}

                    {content.quantitativeAnalysis && (
                        <section className={styles.features}>
                            <h3>{t.score}</h3>
                            <p className={styles.scoreText}>{content.quantitativeAnalysis}</p>
                        </section>
                    )}

                    <section className={styles.features}>
                        <h2>{t.features}</h2>
                        <p>{content.features || "Features to be added."}</p>
                    </section>

                    <section className={styles.prosCons}>
                        <div className={styles.pros}>
                            <h3>{t.pros}</h3>
                            <ul>
                                {content.pros?.map((p: string, i: number) => <li key={i}>{p}</li>) || <li>Great Product</li>}
                            </ul>
                        </div>
                        <div className={styles.cons}>
                            <h3>{t.cons}</h3>
                            <ul>
                                {content.cons?.map((c: string, i: number) => <li key={i}>{c}</li>) || <li>None observed</li>}
                            </ul>
                        </div>
                    </section>

                    {content.comparisonTable && (
                        <section className={styles.comparison}>
                            <h2>{t.comparison}</h2>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>{t.product}</th>
                                            <th>{t.price}</th>
                                            <th>{t.rating}</th>
                                            <th>{t.mainFeature}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {content.comparisonTable.map((item: any, i: number) => (
                                            <tr key={i} className={item.name.includes(campaign.productName) ? styles.highlightRow : ''}>
                                                <td>{item.name}</td>
                                                <td>{item.price}</td>
                                                <td>{item.rating} / 5</td>
                                                <td>{item.mainFeature}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {content.internalLinks && content.internalLinks.length > 0 && (
                        <section className={styles.features} style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', padding: '1.5rem', borderRadius: '8px', marginTop: '2rem' }}>
                            <h3 style={{ color: '#166534', marginTop: 0 }}>{t.review === 'Análisis' ? '📚 Te puede interesar:' : '📚 Read Next:'}</h3>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {content.internalLinks.map((link: any, i: number) => (
                                    <li key={i} style={{ marginBottom: '0.75rem', fontSize: '1.05rem' }}>
                                        <span style={{ marginRight: '0.5rem' }}>👉</span>
                                        <Link href={`/${link.category || 'general'}/${link.slug}`} style={{ color: '#15803d', textDecoration: 'underline', fontWeight: 600 }}>
                                            {link.anchorText}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <section className={styles.verdict}>
                        <h2>{t.verdict}</h2>
                        <p>{content.verdict || "Highly Recommended."}</p>
                        <div className={styles.verdictCta}>
                            <a href={campaign.affiliateLink} target="_blank" rel="noopener noreferrer" className={styles.ctaButton}>
                                {t.checkPrice} {campaign.productName}
                            </a>
                        </div>
                    </section>
                </div>

                <aside className={styles.sidebar}>
                    <div className={styles.stickyCard}>
                        <h3>{campaign.productName}</h3>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={campaign.imageUrl || "https://placehold.co/100x100"} alt="mini" className={styles.miniImg} />
                        <a href={campaign.affiliateLink} target="_blank" rel="noopener noreferrer" className={styles.sidebarBtn}>
                            {lang === 'es' ? 'Ver Oferta en Amazon 🛒' : 'Check Price on Amazon 🛒'}
                        </a>
                    </div>
                </aside>
            </div>

            <RelatedProducts
                currentSlug={currentSlug}
                category={campaign.category || 'general'}
                products={relatedProducts}
            />
        </article>
    );
}
