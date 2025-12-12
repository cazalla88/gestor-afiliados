'use client';

import React from 'react';
import Link from 'next/link';

// --- SAFE RENDER HELPER ---
const SafeRender = (val: any, fallback = "") => {
    if (!val) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    return String(val);
};

interface MasterHubProps {
    campaign: any;
    currentSlug: string;
    relatedProducts?: any[];
}

export default function MasterHubTemplate({ campaign, currentSlug, relatedProducts }: MasterHubProps) {
    // 1. DATA PREPARATION
    let content = campaign.content || {};
    if (typeof content === 'string') {
        try {
            content = JSON.parse(content);
        } catch (e) {
            console.error("Error parsing MasterHub content:", e);
            content = {};
        }
    }

    const date = new Date(campaign.updatedAt || campaign.createdAt).toLocaleDateString(
        campaign.language === 'es' ? 'es-ES' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' }
    );
    const lang = campaign.language === 'es' ? 'es' : 'en';

    // 2. PARSE BODY CONTENT
    // Robust content finder
    let rawBody = content.features || content.articleBody || content.body || content.text || content.content || "";

    // Safety Force to String
    if (Array.isArray(rawBody)) {
        rawBody = rawBody.join('');
    } else if (typeof rawBody === 'object') {
        rawBody = JSON.stringify(rawBody);
    } else {
        rawBody = String(rawBody);
    }

    // Markdwon Helper
    const parseMarkdown = (val: any) => {
        if (!val) return "";
        let text = val;
        if (Array.isArray(val)) text = val.join(" ");
        if (typeof text !== 'string') text = String(text);

        // Basic Markdown Support
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/### (.*?)\n/g, '<h3>$1</h3>')
            .replace(/## (.*?)\n/g, '<h2>$1</h2>')
            .replace(/\n\n/g, '</p><p>');
    };

    const stripHtml = (val: any) => {
        if (!val) return "";
        let text = val;
        if (Array.isArray(val)) text = val.join(" ");
        if (typeof text !== 'string') text = String(text);
        return text.replace(/<[^>]*>/g, "");
    };

    let featuresHtml = "";
    const toc: { text: string; id: string }[] = [];

    if (rawBody) {
        let processedBody = parseMarkdown(rawBody);

        // EXTRACTION TOC
        const h2Regex = /<h2.*?>(.*?)<\/h2>/g;
        let match;
        while ((match = h2Regex.exec(processedBody)) !== null) {
            const rawText = match[1].replace(/<[^>]+>/g, '');
            const anchor = rawText.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            toc.push({ text: rawText, id: anchor });
        }

        // INJECTION IDS & STYLES (Clean Version without Table/KeyTakeaways nonsense)
        featuresHtml = processedBody
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
            .replace(/<h2(.*?)>(.*?)<\/h2>/g, (m: string, attrs: string, text: string) => {
                const cleanText = text.replace(/<[^>]+>/g, '');
                const id = cleanText.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                return `<h2 id="${id}" style="font-size: 1.7rem; font-weight: 700; margin-top: 3rem; margin-bottom: 1.25rem; color: #111; letter-spacing: -0.02em; line-height: 1.2;">${text}</h2>`;
            })
            .replace(/<h3(.*?)>(.*?)<\/h3>/g, '<h3 style="font-size: 1.35rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #333;">$2</h3>')
            .replace(/<p>/g, '<p style="margin-bottom: 1.5rem; line-height: 1.8; font-size: 1.1rem; color: #333;">')
            .replace(/<ul>/g, '<ul style="margin-bottom: 1.5rem; padding-left: 1.25rem;">')
            .replace(/<li>/g, '<li style="margin-bottom: 0.5rem; line-height: 1.6; color: #333;">');
    }

    // 3. TARGET AUDIENCE (Keep this, it was working and useful)
    const targetAudienceHTML = content.targetAudience ? parseMarkdown(content.targetAudience) : null;

    const mainImage = campaign.imageUrl || "https://placehold.co/1200x500/111/444?text=Master+Hub";

    // GRID
    const safeRelated = (relatedProducts || []).filter(p => p.slug !== currentSlug);
    const hasChildren = campaign.children && campaign.children.length > 0;
    const gridItems = hasChildren ? campaign.children : safeRelated;
    const gridTitle = hasChildren ? (lang === 'es' ? 'Guías Relacionadas' : 'Related Guides') : (lang === 'es' ? 'Artículos Destacados' : 'Featured Articles');

    return (
        <div style={{ fontFamily: '"Inter", "Segoe UI", sans-serif', color: '#111', background: '#fff' }}>

            {/* HERO */}
            <section style={{ background: '#0a0a0a', color: 'white', padding: '4rem 1rem 10rem', textAlign: 'center', position: 'relative' }}>
                <div className="container" style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
                    <nav style={{ fontSize: '0.85rem', color: '#ccc', marginBottom: '2rem' }}>
                        <span style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>{campaign.category}</span>
                    </nav>
                    <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '2rem' }}>
                        {SafeRender(campaign.title || campaign.productName)}
                    </h1>
                    <div style={{ color: '#aaa', fontSize: '0.9rem' }}>By <strong style={{ color: '#fff' }}>Nexus Team</strong> • {date}</div>
                </div>
            </section>

            {/* HERO IMAGE */}
            <div className="container" style={{ maxWidth: '1000px', margin: '-8rem auto 0', position: 'relative', zIndex: 3, padding: '0 1rem' }}>
                <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.4)', background: '#222' }}>
                    <img src={mainImage} alt={campaign.title} style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
            </div>

            {/* --- LAYOUT: SIDEBAR + CONTENT --- */}
            <div className="container" style={{ maxWidth: '1200px', margin: '4rem auto', padding: '0 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '3rem' }}>

                {/* LEFT: MAIN CONTENT */}
                <main style={{ flex: '1 1 600px', minWidth: 0 }}>

                    {/* INTRODUCTION */}
                    <div style={{ fontSize: '1.25rem', lineHeight: 1.7, marginBottom: '3rem', color: '#222' }}>
                        <div dangerouslySetInnerHTML={{ __html: parseMarkdown(campaign.description || "") }} />
                    </div>

                    {/* TARGET AUDIENCE (Premium Card Design) */}
                    {targetAudienceHTML && (
                        <div style={{
                            background: '#ffffff',
                            borderRadius: '12px',
                            padding: '2rem',
                            marginBottom: '3rem',
                            borderLeft: '6px solid #2563eb', // Vivid Blue Accent
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)', // Elegant Shadow
                            border: '1px solid #f3f4f6'
                        }}>
                            <h3 style={{
                                marginTop: 0,
                                color: '#111827',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                letterSpacing: '-0.01em'
                            }}>
                                <span style={{ fontSize: '1.5rem' }}>🎯</span>
                                {lang === 'es' ? '¿Para quién es realmente esto?' : 'Who is this really for?'}
                            </h3>
                            <div
                                dangerouslySetInnerHTML={{ __html: targetAudienceHTML }}
                                style={{
                                    lineHeight: 1.8,
                                    color: '#4b5563',
                                    fontSize: '1.05rem',
                                    marginTop: '1rem'
                                }}
                            />
                        </div>
                    )}

                    {/* ARTICLE BODY (CLEAN) */}
                    {featuresHtml && <div dangerouslySetInnerHTML={{ __html: featuresHtml }} />}

                    {/* VERDICT */}
                    {content.verdict && (
                        <div style={{ marginTop: '4rem', padding: '2.5rem', background: '#f0fdf4', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
                            <h2 style={{ marginTop: 0, color: '#166534' }}>{lang === 'es' ? 'Veredicto Final' : 'Final Verdict'}</h2>
                            <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content.verdict) }} style={{ fontSize: '1.15rem', lineHeight: 1.7, color: '#14532d' }} />
                        </div>
                    )}
                </main>

                {/* RIGHT: STICKY SIDEBAR (TOC) */}
                <aside style={{ flex: '0 0 300px', display: 'none', position: 'relative' }}>
                    <div style={{ position: 'sticky', top: '2rem', display: toc.length > 0 ? 'block' : 'none' }}>
                        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #eee' }}>
                            <h4 style={{ marginTop: 0, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem', color: '#888' }}>
                                {lang === 'es' ? 'Análisis' : 'Analysis'}
                            </h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {toc.map((item, i) => (
                                    <li key={i} style={{ marginBottom: '0.75rem', fontSize: '0.95rem', lineHeight: 1.4 }}>
                                        <a href={`#${item.id}`} style={{ textDecoration: 'none', color: '#444', transition: 'color 0.2s', display: 'block' }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = '#2563eb'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = '#444'}>
                                            {i + 1}. {item.text}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </aside>
                {/* HACK: Enable Sidebar only on Desktop via style injection */}
                <style jsx>{`
                    aside { display: none !important; }
                    @media (min-width: 1024px) {
                        aside { display: block !important; }
                    }
                `}</style>
            </div>

            {/* RELATED GRID */}
            {gridItems && gridItems.length > 0 && (
                <section style={{ backgroundColor: '#f8f9fa', padding: '5rem 0' }}>
                    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, textAlign: 'center', marginBottom: '3rem' }}>{gridTitle}</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                            {gridItems.map((child: any) => (
                                <Link key={child.slug} href={`/${child.category || 'general'}/${child.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', height: '100%' }}>
                                        <div style={{ height: '200px', background: '#eee' }}>
                                            {child.imageUrl && <img src={child.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                        </div>
                                        <div style={{ padding: '1.5rem' }}>
                                            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem' }}>{SafeRender(child.title || child.productName)}</h3>
                                            <p style={{ fontSize: '0.9rem', color: '#666' }}>{stripHtml(child.description || "").slice(0, 80)}...</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
