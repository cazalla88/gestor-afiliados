"use client";

import { deleteCampaign, duplicateCampaign, analyzeTrends } from "@/app/actions";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

import { useLanguage } from "@/context/LanguageContext";

export default function DashboardClient({ campaigns }: { campaigns: any[] }) {
    const { t, language } = useLanguage();
    const router = useRouter();
    const [list, setList] = useState(campaigns);
    const [searchQuery, setSearchQuery] = useState("");

    // Trend Hunter States
    const [showTrendModal, setShowTrendModal] = useState(false);
    const [trendCategory, setTrendCategory] = useState("");
    const [trendResults, setTrendResults] = useState<any[]>([]);
    const [isTrendLoading, setIsTrendLoading] = useState(false);

    // Battle Mode States
    const [showBattleModal, setShowBattleModal] = useState(false);
    const [battleSelection, setBattleSelection] = useState<string[]>([]);
    const [isBattleLoading, setIsBattleLoading] = useState(false);

    const toggleBattleSelection = (slug: string) => {
        if (battleSelection.includes(slug)) {
            setBattleSelection(prev => prev.filter(s => s !== slug));
        } else {
            if (battleSelection.length >= 2) return alert("You can only compare 2 products!");
            setBattleSelection(prev => [...prev, slug]);
        }
    };

    const handleBattleCreation = async () => {
        if (battleSelection.length !== 2) return;
        setIsBattleLoading(true);

        const campA = list.find(c => c.slug === battleSelection[0]);
        const campB = list.find(c => c.slug === battleSelection[1]);

        if (!campA || !campB) return;

        const storedKey = localStorage.getItem("gemini_api_key") || "";

        // Dynamic Import to avoid server-side issues if any
        const { generateBattleContent, createCampaign } = await import("@/app/actions");

        const content = await generateBattleContent(campA, campB, storedKey, language);

        if (content.error) {
            alert("Battle AI Error: " + content.error);
            setIsBattleLoading(false);
            return;
        }

        const battleSlug = `vs-${campA.slug.substring(0, 20)}-${campB.slug.substring(0, 20)}`.replace(/[^a-z0-9-]/g, '');

        const res = await createCampaign({
            id: battleSlug,
            type: 'blog',
            category: campA.category || 'general',
            language: language,
            productName: `${campA.productName} vs ${campB.productName}`,
            title: content.title,
            description: content.introduction,
            affiliateLink: campA.affiliateLink, // Primary link
            imageUrl: campA.imageUrl, // Use A's image for now
            ...content
        });

        if (res.success) {
            alert("Battle Created! ⚔️");
            router.push(`/${res.type === 'landing' ? 'p' : 'blog'}/${res.slug}`); // Redirect to edit
            setList(prev => [...prev, { ...campA, slug: res.slug, productName: `${campA.productName} vs ${campB.productName}`, type: 'blog', createdAt: new Date() }]);
            setShowBattleModal(false);
            setBattleSelection([]);
        } else {
            alert("Failed to save battle: " + res.error);
        }
        setIsBattleLoading(false);
    };

    // Generate fake but believable view count based on campaign creation date
    const getFakeViews = (createdAt: Date) => {
        const daysSinceCreation = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const baseViews = Math.floor(Math.random() * 500) + 100;
        return baseViews + (daysSinceCreation * Math.floor(Math.random() * 50));
    };

    const handleDelete = async (slug: string) => {
        if (!confirm(t.dashboard.confirmDelete)) return;

        const res = await deleteCampaign(slug);
        if (res.success) {
            setList(prev => prev.filter(c => c.slug !== slug));
            router.refresh();
        } else {
            alert(t.dashboard.errorDelete);
        }
    };

    const handleTrendAnalysis = async () => {
        if (!trendCategory) return;
        setIsTrendLoading(true);
        setTrendResults([]);

        // Use key from user's storage
        const storedKey = localStorage.getItem("gemini_api_key") || "";

        const res = await analyzeTrends(trendCategory, language, storedKey);

        if (res.error) {
            alert("Trend Analysis Error: " + res.error + "\nMake sure you have set your API Key in a campaign creation form first.");
        } else if (res.trends) {
            setTrendResults(res.trends);
        }
        setIsTrendLoading(false);
    };

    // Filter campaigns based on search query
    const filteredList = list.filter(camp =>
        camp.productName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.dashboardContainer}>
            <header className={styles.header}>
                <div>
                    <h1>{t.dashboard.title}</h1>
                    <p className={styles.statsCount}>{t.dashboard.total} {list.length} {t.dashboard.campaigns}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setShowTrendModal(true)}
                        className={styles.createBtn}
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                    >
                        {t.dashboard.trendHunterBtn}
                    </button>
                    <button
                        onClick={() => setShowBattleModal(true)}
                        className={styles.createBtn}
                        style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
                    >
                        ⚔️ Battle Mode
                    </button>
                    <Link href="/categories" className={styles.createBtn} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', textDecoration: 'none' }}>
                        📂 Categorías
                    </Link>
                    <Link href="/" className={styles.createBtn}>{t.dashboard.create}</Link>
                </div>
            </header>

            {/* Trend Hunter Modal */}
            {showTrendModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
                    zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'
                }}>
                    <div style={{
                        background: '#111', padding: '2rem', borderRadius: '24px',
                        maxWidth: '900px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
                        border: '1px solid #333', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ color: 'white', margin: 0, fontSize: '1.8rem' }}>{t.dashboard.trendModalTitle} 🔮</h2>
                                <p style={{ color: '#888', margin: '0.5rem 0 0 0' }}>AI-Powered prediction validated with live Google Trends data.</p>
                            </div>
                            <button
                                onClick={() => setShowTrendModal(false)}
                                style={{ background: '#222', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem' }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                placeholder={t.dashboard.trendInputLabel}
                                className={styles.searchInput}
                                style={{ flex: 1, minWidth: '200px' }}
                                value={trendCategory}
                                onChange={(e) => setTrendCategory(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleTrendAnalysis()}
                            />
                            <button
                                onClick={handleTrendAnalysis}
                                className={styles.createBtn}
                                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', whiteSpace: 'nowrap' }}
                                disabled={isTrendLoading}
                            >
                                {isTrendLoading ? t.dashboard.trendLoading : t.dashboard.trendAnalyzeBtn}
                            </button>
                        </div>

                        {trendResults.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                {trendResults.map((trend, i) => (
                                    <div key={i} className="animate-slide-up" style={{
                                        background: '#1a1a1a', padding: '1.5rem', borderRadius: '16px',
                                        border: '1px solid #333', display: 'flex', flexDirection: 'column',
                                        animationDelay: `${i * 100}ms`
                                    }}>
                                        <div style={{
                                            background: 'rgba(124, 58, 237, 0.1)', color: '#a78bfa',
                                            padding: '0.25rem 0.75rem', borderRadius: '50px', alignSelf: 'flex-start',
                                            fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '1rem'
                                        }}>
                                            🔥 Trending
                                        </div>
                                        <h3 style={{ color: 'white', marginTop: 0, fontSize: '1.3rem' }}>{trend.nicheTitle}</h3>
                                        <p style={{ color: '#a1a1aa', fontSize: '0.95rem', lineHeight: '1.6', flex: 1 }}>{trend.reason}</p>

                                        <div style={{ background: '#262626', padding: '1rem', borderRadius: '12px', marginTop: '1.5rem' }}>
                                            <p style={{ color: '#fff', fontSize: '0.9rem', margin: 0 }}>
                                                💡 <strong style={{ color: '#fbbf24' }}>Suggested Product:</strong><br />
                                                {trend.suggestedProduct}
                                            </p>

                                            {trend.realData && trend.realData.hasData && (
                                                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #333', fontSize: '0.85rem' }}>
                                                    <span style={{ color: '#9ca3af', marginRight: '0.5rem' }}>Google Trends (1y):</span>
                                                    <span style={{
                                                        color: trend.realData.direction === 'up' ? '#4ade80' :
                                                            trend.realData.direction === 'down' ? '#f87171' : '#fbbf24',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {trend.realData.direction === 'up' ? '📈 Trending Up' :
                                                            trend.realData.direction === 'down' ? '📉 Cooling Down' : '➖ Stable'}
                                                        {' '}({trend.realData.growthPercent > 0 ? '+' : ''}{trend.realData.growthPercent}%)
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!isTrendLoading && trendResults.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#444', padding: '3rem' }}>
                                <p>Enter a category (e.g., "Smart Home", "Fitness", "Pets") to detect future trends validated with real data.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Battle Mode Modal */}
            {showBattleModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(5px)',
                    zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'
                }}>
                    <div style={{
                        background: '#111', padding: '2rem', borderRadius: '24px',
                        maxWidth: '800px', width: '100%', maxHeight: '85vh', overflowY: 'auto',
                        border: '1px solid #ef4444', boxShadow: '0 0 50px rgba(239, 68, 68, 0.2)'
                    }}>
                        <h2 style={{ color: 'white', marginTop: 0 }}>⚔️ Battle Arena Setup</h2>
                        <p style={{ color: '#aaa' }}>Select exactly 2 products to generate a "Versus" comparison article.</p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem', maxHeight: '400px', overflowY: 'auto', padding: '1rem', background: '#000', borderRadius: '12px' }}>
                            {list.map(camp => (
                                <div
                                    key={camp.slug}
                                    onClick={() => toggleBattleSelection(camp.slug)}
                                    style={{
                                        cursor: 'pointer',
                                        border: battleSelection.includes(camp.slug) ? '2px solid #ef4444' : '1px solid #333',
                                        background: battleSelection.includes(camp.slug) ? 'rgba(239, 68, 68, 0.1)' : '#1a1a1a',
                                        padding: '1rem', borderRadius: '8px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '0.9rem' }}>{camp.productName}</h4>
                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>{new Date(camp.createdAt).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                onClick={() => setShowBattleModal(false)}
                                style={{ background: 'transparent', border: '1px solid #333', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBattleCreation}
                                disabled={battleSelection.length !== 2 || isBattleLoading}
                                style={{
                                    background: battleSelection.length === 2 ? '#ef4444' : '#333',
                                    color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '8px',
                                    cursor: battleSelection.length === 2 ? 'pointer' : 'not-allowed',
                                    fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                }}
                            >
                                {isBattleLoading ? "🔥 FIGHTING (Generating)..." : "⚔️ START BATTLE"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Categories Grid */}
            <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ color: '#fff', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '700' }}>
                    📂 Categorías
                </h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {Object.entries({
                        fashion: { name: 'Moda', icon: '👗' },
                        tech: { name: 'Tecnología', icon: '💻' },
                        home: { name: 'Hogar', icon: '🏠' },
                        sports: { name: 'Deportes', icon: '⚽' },
                        beauty: { name: 'Belleza', icon: '💄' },
                        books: { name: 'Libros', icon: '📚' },
                        toys: { name: 'Juegos', icon: '🎮' },
                        general: { name: 'General', icon: '🏷️' },
                    }).map(([slug, category]) => {
                        const count = list.filter(c => c.category === slug).length;
                        return (
                            <Link
                                key={slug}
                                href={`/categories/${slug}`}
                                style={{
                                    background: 'linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%)',
                                    border: '1px solid #333',
                                    borderRadius: '16px',
                                    padding: '2rem  1.5rem',
                                    textDecoration: 'none',
                                    color: 'white',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    textAlign: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.borderColor = '#667eea';
                                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = '#333';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ fontSize: '3rem' }}>{category.icon}</div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                                    {category.name}
                                </h3>
                                <span style={{
                                    fontSize: '0.85rem',
                                    color: '#888',
                                    background: 'rgba(102, 126, 234, 0.1)',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '12px'
                                }}>
                                    {count} {count === 1 ? 'artículo' : 'artículos'}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {list.length > 0 && (
                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder={t.dashboard.search}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
            )}

            {filteredList.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>{searchQuery ? t.dashboard.noResults : t.dashboard.empty}</p>
                    {!searchQuery && <Link href="/" style={{ marginTop: '1rem', color: '#db2777' }}>{t.dashboard.start}</Link>}
                </div>
            ) : (
                <div className={styles.grid}>
                    {filteredList.map((camp) => (
                        <div key={camp.id} className={styles.card}>
                            <div className={styles.cardImage}>
                                <Image
                                    src={camp.imageUrl || "https://placehold.co/300x200"}
                                    alt={camp.productName}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                                <span className={`${styles.badge} ${camp.type === 'blog' ? styles.blogBadge : styles.landingBadge}`}>
                                    {camp.type === 'landing' ? t.dashboard.landingBadge : t.dashboard.blogBadge}
                                </span>
                                <a href={`/${camp.category}/${camp.slug}`} target="_blank" className={styles.viewLink} style={{ opacity: 0 }}>
                                    {/* Invisble link for SEO/Structure, real click handled by actions */}
                                </a>
                            </div>
                            <div className={styles.cardContent}>
                                <h3>{camp.productName}</h3>
                                <div className={styles.date}>
                                    <span>{new Date(camp.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    <span className={styles.viewCount}>👁️ {getFakeViews(camp.createdAt).toLocaleString()} {t.dashboard.views}</span>
                                </div>

                                <div className={styles.actions}>
                                    <a href={`/${camp.category || 'general'}/${camp.slug}`} target="_blank" className={`${styles.actionBtn} ${styles.viewLink}`} title={t.dashboard.view}>
                                        👁️
                                    </a>
                                    <Link href={`/?edit=${camp.slug}`} className={`${styles.actionBtn} ${styles.editBtn}`} title={t.dashboard.edit}>
                                        ✏️
                                    </Link>
                                    <button onClick={() => handleDelete(camp.slug)} className={`${styles.actionBtn} ${styles.deleteBtn}`} title={t.dashboard.delete}>
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
