import styles from "@/app/blog/[slug]/page.module.css";
import Link from "next/link";
import RelatedProducts from "@/components/RelatedProducts";

interface BlogTemplateProps {
    campaign: any;
    currentSlug: string;
    relatedProducts: any[];
}

export default function BlogTemplate({ campaign, currentSlug, relatedProducts }: BlogTemplateProps) {
    // Parse structured content JSON
    let content: any = {};
    try {
        content = campaign.content ? JSON.parse(campaign.content) : {};
    } catch (e) {
        console.error("Error parsing content JSON", e);
    }

    const date = new Date(campaign.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });

    const jsonLd = {
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
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <header className={styles.header}>
                <div className="container">
                    <div className={styles.meta}>
                        <span className={styles.category}>Review</span>
                        <span className={styles.date}>{date}</span>
                    </div>
                    <h1 className={styles.title}>{campaign.title}</h1>
                    <div className={styles.author}>
                        <div className={styles.avatar}>A</div>
                        <span>By <strong>AffiliateNexus Editor</strong></span>
                    </div>
                </div>
            </header>

            <div className={styles.featuredImageWrapper}>
                <div className="container">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={campaign.imageUrl || "https://placehold.co/1200x600/222/FFF?text=Review+Image"}
                        alt={campaign.productName}
                        className={styles.featuredImage}
                    />
                </div>
            </div>

            <div className={`container ${styles.contentGrid}`}>
                <div className={styles.mainContent}>
                    <section className={styles.intro}>
                        <p>{content.introduction || campaign.description}</p>
                    </section>

                    {content.targetAudience && (
                        <section className={styles.features} style={{ backgroundColor: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #2563eb' }}>
                            <h3 style={{ marginTop: 0, color: '#111' }}>🎯 Who is this for?</h3>
                            <p style={{ marginBottom: 0, color: '#444' }}>{content.targetAudience}</p>
                        </section>
                    )}

                    {content.quantitativeAnalysis && (
                        <section className={styles.features}>
                            <h3>📊 Performance Score</h3>
                            <p className={styles.scoreText}>{content.quantitativeAnalysis}</p>
                        </section>
                    )}

                    <section className={styles.features}>
                        <h2>Main Features</h2>
                        <p>{content.features || "Features to be added."}</p>
                    </section>

                    <section className={styles.prosCons}>
                        <div className={styles.pros}>
                            <h3>✅ The Good</h3>
                            <ul>
                                {content.pros?.map((p: string, i: number) => <li key={i}>{p}</li>) || <li>Great Product</li>}
                            </ul>
                        </div>
                        <div className={styles.cons}>
                            <h3>❌ The Bad</h3>
                            <ul>
                                {content.cons?.map((c: string, i: number) => <li key={i}>{c}</li>) || <li>None observed</li>}
                            </ul>
                        </div>
                    </section>

                    {content.comparisonTable && (
                        <section className={styles.comparison}>
                            <h2>Comparison vs Competitors</h2>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Price</th>
                                            <th>Rating</th>
                                            <th>Main Feature</th>
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

                    <section className={styles.verdict}>
                        <h2>Final Verdict</h2>
                        <p>{content.verdict || "Highly Recommended."}</p>
                        <div className={styles.verdictCta}>
                            <a href={campaign.affiliateLink} target="_blank" rel="noopener noreferrer" className={styles.ctaButton}>
                                Check Best Price for {campaign.productName}
                            </a>
                        </div>
                    </section>
                </div>

                <aside className={styles.sidebar}>
                    <div className={styles.stickyCard}>
                        <h3>{campaign.productName}</h3>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={campaign.imageUrl || "https://placehold.co/100x100"} alt="mini" className={styles.miniImg} />
                        <a href={campaign.affiliateLink} className={styles.sidebarBtn}>Buy Now</a>
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
