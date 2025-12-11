import styles from "@/app/blog/[slug]/page.module.css";
import Link from "next/link";
import Image from "next/image";
import RelatedProducts from "@/components/RelatedProducts";
import StickyBar from "@/components/StickyBar";
import ProductGallery from "@/components/ProductGallery";

interface BlogTemplateProps {
    campaign: any;
    currentSlug: string;
    relatedProducts: any[];
    isEditable?: boolean;
    onImageUpdate?: (index: number, newUrl: string) => void;
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
        mainFeature: "Main Feature",
        disclaimer: "As an Amazon Associate I earn from qualifying purchases.",
        rights: "AffiliateNexus. All rights reserved."
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
        mainFeature: "Característica",
        disclaimer: "En calidad de Afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables.",
        rights: "AffiliateNexus. Todos los derechos reservados."
    }
};

export default function BlogTemplate({ campaign, currentSlug, relatedProducts, isEditable, onImageUpdate }: BlogTemplateProps) {
    const lang = (campaign.language === 'es' ? 'es' : 'en') as keyof typeof LABELS;
    const t = LABELS[lang];

    const isHub = campaign.type === 'hub_principal' || campaign.type === 'subhub';

    // Parse structured content JSON
    let content: any = {};
    try {
        content = campaign.content ? JSON.parse(campaign.content) : {};
    } catch (e) {
        console.error("Error parsing content JSON", e);
    }

    const date = new Date(campaign.createdAt).toLocaleDateString(lang === 'es' ? "es-ES" : "en-US", { year: 'numeric', month: 'long', day: 'numeric' });

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
            "ratingValue": "9.5",
            "bestRating": "10"
        },
        "publisher": {
            "@type": "Organization",
            "name": "AffiliateNexus"
        },
        "datePublished": campaign.createdAt
    };


    // --- MARKDOWN PARSER & TOC EXTRACTION ---
    // --- MARKDOWN PARSER & TOC EXTRACTION ---
    const { html: featuresHtml, headers: featureHeaders } = (() => {
        const rawFeatures = content.features;
        const headers: { id: string, text: string }[] = [];
        let count = 0;

        // CASE A: MASTER HUB FORMAT (Array)
        if (Array.isArray(rawFeatures)) {
            let htmlChunks: string[] = [];
            rawFeatures.forEach((feat: any) => {
                const id = `feat-${count++}`;

                // SUB-CASE A1: String HTML (New Prompt Format)
                if (typeof feat === 'string') {
                    // Extract Title from <h2> or <h3> tags for TOC
                    const titleMatch = feat.match(/<h[23][^>]*>(.*?)<\/h[23]>/);
                    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : `Section ${count}`;

                    headers.push({ id, text: title });

                    // Inject ID into the first heading tag found in the string
                    let processedHtml = feat;
                    if (titleMatch) {
                        processedHtml = feat.replace(titleMatch[0], `<h3 id="${id}" style="margin-top: 2.5rem; margin-bottom: 1rem; font-size: 1.6rem; color: #111; border-bottom: 2px solid #f3f4f6; padding-bottom: 0.5rem;">${title}</h3>`);
                    } else {
                        // If no heading found, prepend one (fallback)
                        processedHtml = `<h3 id="${id}">${title}</h3>` + feat;
                    }
                    htmlChunks.push(`<div class="hub-section">${processedHtml}</div>`);
                }
                // SUB-CASE A2: Object Format (Legacy / Fallback)
                else if (typeof feat === 'object' && feat.title) {
                    headers.push({ id, text: feat.title });
                    htmlChunks.push(`
                        <div class="hub-section">
                            <h3 id="${id}" style="margin-top: 2.5rem; margin-bottom: 1rem; font-size: 1.6rem; color: #111; border-bottom: 2px solid #f3f4f6; padding-bottom: 0.5rem;">
                                ${feat.title}
                            </h3>
                            <div style="font-size: 1.05rem; line-height: 1.8; color: #374151;">
                                ${feat.description || ""}
                            </div>
                        </div>
                    `);
                }
            });
            return { html: htmlChunks.join(""), headers };
        }

        // CASE B: LEGACY REVIEW FORMAT (Markdown String)
        const text = typeof rawFeatures === 'string' ? rawFeatures : "";

        let html = text
            // 1. Headers ### (Create IDs for TOC)
            .replace(/###\s+(.+)/g, (match: string, title: string) => {
                const id = `feat-${count++}`;
                headers.push({ id, text: title });
                return `<h3 id="${id}" style="margin-top: 2rem; font-size: 1.4rem; color: #111;">${title}</h3>`;
            })
            // 2. Bold **text**
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // 3. Bullet points - 
            .replace(/-\s+(.+)/g, '<li>$1</li>')
            // 4. Line breaks (preserve paragraphs)
            .replace(/\n\n/g, '<br/><br/>');

        return { html, headers };
    })();

    return (
        <article className={styles.articleContainer}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFull) }}
            />
            {/* NEW SPLIT HERO SECTION */}
            <section className={styles.heroSection}>
                <div className="container">
                    {/* BREADCRUMBS */}
                    <nav aria-label="Breadcrumb" style={{ fontSize: '0.85rem', color: '#ccc', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                        <Link href={`/`} style={{ textDecoration: 'none', color: '#ccc', opacity: 0.8 }}>Home</Link>
                        <span style={{ margin: '0 0.5rem', opacity: 0.5 }}>/</span>
                        <Link href={`/${campaign.category}`} style={{ textDecoration: 'none', color: '#fff', fontWeight: 500 }}>
                            {campaign.category.charAt(0).toUpperCase() + campaign.category.slice(1)}
                        </Link>
                        {campaign.parent && (
                            <>
                                <span style={{ margin: '0 0.5rem', opacity: 0.5 }}>/</span>
                                <Link href={`/${campaign.parent.category || campaign.category}/${campaign.parent.slug}`} style={{ textDecoration: 'none', color: '#db2777', fontWeight: 600 }}>
                                    {campaign.parent.title}
                                </Link>
                            </>
                        )}
                    </nav>
                    {/* NEW EDITORIAL HEADER (Centered via CSS) */}
                    <div className={styles.editorialHeader}>
                        <div className={styles.meta}>
                            <span className={styles.heroCategory}>{t.review}</span>
                            <span style={{ margin: '0 0.5rem', color: '#ccc' }}>|</span>
                            <span className={styles.date}>{date}</span>
                        </div>

                        <h1 className={styles.heroTitle}>{campaign.title}</h1>

                        <div className={styles.author}>
                            <div className={styles.avatar} style={{ background: '#111', color: '#fff' }}>N</div>
                            <span>{t.by} <strong>{["Sarah Jenkins", "Michael Ross", "Jessica Chen", "David Baker", "Emma Wilson"][campaign.productName.length % 5]}</strong> <span style={{ opacity: 0.6, fontSize: '0.9em' }}> | Nexus Team</span></span>
                        </div>
                    </div>

                    <div className={styles.heroGrid}>
                        {/* LEFT: IMAGE GALLERY */}
                        <div style={{ width: '100%', minHeight: '400px' }}>
                            <ProductGallery
                                mainImage={campaign.imageUrl || "https://placehold.co/600x600/222/FFF?text=Product+Image"}
                                productName={campaign.productName}
                                score={content.quantitativeAnalysis?.match(/(\d+(\.\d+)?)\/10/)?.[1] || "9.5"}
                                badgeLabel={lang === 'es' ? 'EXCELENTE' : 'EXCELLENT'}
                                galleryImages={(campaign.galleryImages && campaign.galleryImages.length > 0) ? campaign.galleryImages : (content.galleryImagesBackup || [])}
                                isEditable={isEditable}
                                onImageUpdate={onImageUpdate}
                                affiliateLink={campaign.affiliateLink}
                            />
                        </div>

                        {/* RIGHT: DESCRIPTION & CTA */}
                        <div className={styles.heroContent} style={{ justifyContent: 'center' }}>
                            <div className={styles.heroDescription} dangerouslySetInnerHTML={{ __html: campaign.description }} />

                            {!isHub && (
                                <a href={campaign.affiliateLink} target="_blank" rel="noopener noreferrer" className={styles.heroCta}>
                                    {lang === 'es' ? 'Ver Oferta en Amazon 🛒' : 'Check Price on Amazon 🛒'}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <div className={`container ${styles.contentGrid}`}>
                <div className={styles.mainContent}>
                    {/* Intro Section - Only show if different from hero description */}
                    {content.introduction && content.introduction.trim() !== (campaign.description || "").trim() && (
                        <section id="intro" className={styles.intro}>
                            <div dangerouslySetInnerHTML={{ __html: content.introduction.replace(/\n/g, '<br/>') }} />
                        </section>
                    )}

                    {/* NEW: QUICK VERDICT / KEY HIGHLIGHTS BOX - ONLY FOR REVIEWS */}
                    {!isHub && content.pros && content.pros.length > 0 && (
                        <div style={{
                            background: '#fdf2f8',
                            borderLeft: '4px solid #db2777',
                            padding: '1.25rem',
                            borderRadius: '8px',
                            marginBottom: '2.5rem',
                            marginTop: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#831843' }}>⚡ {t.verdict === 'Veredicto Final' ? 'En Resumen:' : 'Quick Verdict:'}</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
                                {content.pros.slice(0, 3).map((pro: string, idx: number) => (
                                    <span key={idx} style={{
                                        background: 'white',
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '20px',
                                        fontSize: '0.9rem',
                                        color: '#333',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                        border: '1px solid #fbcfe8',
                                        fontWeight: 500,
                                        display: 'inline-block'
                                    }}>
                                        ✅ {pro}
                                    </span>
                                ))}
                                <span style={{
                                    background: 'white',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '20px',
                                    fontSize: '0.9rem',
                                    color: '#be185d',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    border: '1px solid #fbcfe8',
                                    fontWeight: 800
                                }}>
                                    ⭐ {content.quantitativeAnalysis?.match(/(\d+(\.\d+)?)\/10/)?.[1] || "9.5"}/10 {lang === 'es' ? 'Nota' : 'Score'}
                                </span>
                            </div>
                        </div>
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

                    <section id="features" className={styles.features}>
                        {!isHub && <h2>{t.features}</h2>}
                        {/* RENDER PARSED FEATURES HTML */}
                        <div dangerouslySetInnerHTML={{ __html: featuresHtml || "<p>Features to be added.</p>" }} />
                    </section>

                    {!isHub && (
                        <section id="pros-cons" className={styles.prosCons}>
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
                    )}

                    {!isHub && content.comparisonTable && (
                        <section id="comparison" className={styles.comparison}>
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
                                                <td>{item.price.replace(/\$/g, '€')}</td>
                                                <td><strong>{item.rating}</strong> <span style={{ color: '#888', fontSize: '0.8em' }}>/ 10</span></td>
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

                    <section id="verdict" className={styles.verdict}>
                        <h2>{isHub ? (lang === 'es' ? 'Conclusión' : 'Summary') : t.verdict}</h2>
                        <p>{content.verdict || "Highly Recommended."}</p>
                        {!isHub && (
                            <div className={styles.verdictCta}>
                                <a href={campaign.affiliateLink} target="_blank" rel="noopener noreferrer" className={styles.pulseCtaButton}>
                                    {lang === 'es' ? 'Ver Mejor Precio Ahora' : 'Check Best Price Now'}
                                </a>
                            </div>
                        )}
                    </section>
                </div>

                <aside className={styles.sidebar}>
                    {/* NEW TABLE OF CONTENTS */}
                    <div className={styles.stickyCard} style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>
                            {lang === 'es' ? 'Índice de Contenidos' : 'Table of Contents'}
                        </h4>
                        <nav>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <li><a href="#intro" style={{ color: '#555', textDecoration: 'none', fontSize: '0.95rem' }}>1. {lang === 'es' ? 'Introducción' : 'Introduction'}</a></li>

                                {/* LOGIC BRANCH: FLAT for Hubs, NESTED for Reviews */}
                                {isHub ? (
                                    // HUB TOC: Flattened Headers (2, 3, 4...)
                                    featureHeaders.map((h, i) => (
                                        <li key={i}>
                                            <a href={`#${h.id}`} style={{ color: '#555', textDecoration: 'none', fontSize: '0.95rem' }}>{i + 2}. {h.text}</a>
                                        </li>
                                    ))
                                ) : (
                                    // REVIEW TOC: Nested under "Features"
                                    <li>
                                        <a href="#features" style={{ color: '#555', textDecoration: 'none', fontSize: '0.95rem' }}>2. {t.features}</a>
                                        {featureHeaders.length > 0 && (
                                            <ul style={{ listStyle: 'none', paddingLeft: '1rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {featureHeaders.map((h, i) => (
                                                    <li key={i}>
                                                        <a href={`#${h.id}`} style={{ color: '#888', textDecoration: 'none', fontSize: '0.85rem' }}>• {h.text}</a>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                )}

                                {!isHub && <li><a href="#pros-cons" style={{ color: '#555', textDecoration: 'none', fontSize: '0.95rem' }}>3. {t.pros} & {t.cons}</a></li>}
                                {!isHub && <li><a href="#comparison" style={{ color: '#555', textDecoration: 'none', fontSize: '0.95rem' }}>4. {t.comparison}</a></li>}

                                <li>
                                    <a href="#verdict" style={{ color: '#555', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 'bold' }}>
                                        {/* Dynamic numbering calculation */}
                                        {isHub ? (featureHeaders.length + 2) + '.' : '5.'} {isHub ? (lang === 'es' ? 'Conclusión' : 'Summary') : t.verdict}
                                    </a>
                                </li>
                            </ul>
                        </nav>
                    </div>

                    {!isHub && (
                        <div className={styles.stickyCard}>
                            <h3>{campaign.productName}</h3>
                            <img src={campaign.imageUrl || "https://placehold.co/100x100"} alt="mini" className={styles.miniImg} />
                            <a href={campaign.affiliateLink} target="_blank" rel="noopener noreferrer" className={styles.nexusSidebarBtn}>
                                {lang === 'es' ? 'Ver Oferta en Amazon 🛒' : 'Check Price on Amazon 🛒'}
                            </a>
                        </div>
                    )}
                </aside>
            </div>


            {/* CLUSTER CONTENT (HUB CHILDREN) */}
            {campaign.children && campaign.children.length > 0 && (
                <section className="container" style={{ margin: '4rem auto', maxWidth: '1200px', padding: '0 1rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem', borderLeft: '4px solid #7c3aed', paddingLeft: '1rem' }}>
                        {lang === 'es' ? `Explora más en esta Guía` : `More in this Guide`}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {campaign.children.map((child: any) => (
                            <Link key={child.slug} href={`/${campaign.category}/${child.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div style={{ border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden', height: '100%', transition: 'transform 0.2s', backgroundColor: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}
                                // onMouseOver handled in CSS ideally, simplified here
                                >
                                    {child.imageUrl && (
                                        <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
                                            <Image src={child.imageUrl} alt={child.title || 'Post Image'} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 300px" />
                                        </div>
                                    )}
                                    <div style={{ padding: '1rem' }}>
                                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#7c3aed', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                                            {child.type === 'subhub' ? '📚 GUIDE' : '📝 REVIEW'}
                                        </span>
                                        <h3 style={{ fontSize: '1.1rem', margin: '0.5rem 0', fontWeight: '600', lineHeight: '1.3' }}>{child.title}</h3>
                                        <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {child.description}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            <RelatedProducts
                currentSlug={currentSlug}
                category={campaign.category || 'general'}
                products={relatedProducts}
            />

            <footer style={{ textAlign: 'center', padding: '3rem 1rem 6rem 1rem', borderTop: '1px solid #eee', marginTop: '3rem', backgroundColor: '#fdfdfd' }}>
                <div className="container">
                    <p style={{ fontSize: '0.8rem', color: '#666', lineHeight: '1.5', marginBottom: '0.5rem', maxWidth: '800px', margin: '0 auto 0.5rem auto' }}>
                        {t.disclaimer}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <p style={{ fontSize: '0.8rem', color: '#999', margin: 0 }}>
                            &copy; {new Date().getFullYear()} {t.rights}
                        </p>
                        <span style={{ color: '#ddd' }}>|</span>
                        <Link href="/privacy-policy" style={{ fontSize: '0.8rem', color: '#999', textDecoration: 'underline' }}>
                            {lang === 'es' ? 'Política de Privacidad' : 'Privacy Policy'}
                        </Link>
                    </div>
                </div>
            </footer>

            {!isHub && (
                <StickyBar
                    title={campaign.title}
                    price={content.comparisonTable?.[0]?.price || "€€€"}
                    rating={content.quantitativeAnalysis?.match(/(\d+(\.\d+)?)\/10/)?.[1] || "9.5"}
                    affiliateLink={campaign.affiliateLink}
                    imageUrl={campaign.imageUrl}
                    lang={lang}
                />
            )}

        </article>
    );
}
