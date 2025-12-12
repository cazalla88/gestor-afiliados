'use client';

import React from 'react';
import Link from 'next/link';
import { Campaign } from '@prisma/client';

// --- SAFE RENDER HELPER (Crucial para evitar Crash 500) ---
const SafeRender = (val: any, fallback = "") => {
    if (!val) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
        return val.title || val.text || val.label || JSON.stringify(val);
    }
    return String(val);
};

interface MasterHubProps {
    campaign: any;
    currentSlug: string;
    relatedProducts?: any[];
}

export default function MasterHubTemplate({ campaign, currentSlug, relatedProducts }: MasterHubProps) {
    // 1. Extracción Segura de Datos
    let content = campaign.content || {};
    // FIX: Prisma returns 'content' as a String if defined as such in schema, must parse manually
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

    // 2. feature parsing robusto (SEARCH IN ALL KEYS + HANDLE ARRAY)
    // Emergency Fallback: Buscamos el texto en cualquier propiedad probable
    let rawBody = content.features || content.articleBody || content.body || content.text || content.content || "";

    // FIX: If AI returns an array of sections (common in Hub prompt), join them
    if (Array.isArray(rawBody)) {
        rawBody = rawBody.join('');
    }

    // HELPER: Convert Markdown bold to HTML bold if AI messed up
    const parseMarkdown = (text: string) => {
        if (!text) return "";
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    };

    // HELPER: Strip HTML tags for clean card text
    const stripHtml = (html: string) => {
        if (!html) return "";
        return html.replace(/<[^>]*>/g, "");
    };

    let featuresHtml = "";
    if (typeof rawBody === 'string') {
        // Parse Markdown first
        let processedBody = parseMarkdown(rawBody);

        featuresHtml = processedBody
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "") // Anti-XSS básico
            .replace(/<h2>/g, '<h2 style="font-size: 1.75rem; font-weight: 700; margin-top: 3rem; margin-bottom: 1.25rem; color: #111; letter-spacing: -0.02em; line-height: 1.2;">')
            .replace(/<h3>/g, '<h3 style="font-size: 1.4rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #222; letter-spacing: -0.01em; line-height: 1.3;">')
            .replace(/<p>/g, '<p style="margin-bottom: 1.5rem; line-height: 1.75; font-size: 1.05rem; color: #333;">')
            .replace(/<ul>/g, '<ul style="margin-bottom: 1.5rem; padding-left: 1.2rem;">')
            .replace(/<li>/g, '<li style="margin-bottom: 0.5rem; line-height: 1.6; color: #333;">');
    }

    // TOC REMOVED AS REQUESTED

    // 3. Determine Grid Content (Children vs Related Fallback)
    // Filter out current page from related products just in case
    const safeRelated = (relatedProducts || []).filter(p => p.slug !== currentSlug);
    const hasChildren = campaign.children && campaign.children.length > 0;

    // If we have children, use them. If not, use generic related products from category.
    const gridItems = hasChildren ? campaign.children : safeRelated;
    const gridTitle = hasChildren
        ? (lang === 'es' ? 'Guías Relacionadas' : 'Related Guides')
        : (lang === 'es' ? 'Artículos Destacados' : 'Featured Articles');
    const labelText = hasChildren
        ? (lang === 'es' ? 'Explora en profundidad' : 'Deep Dive')
        : (lang === 'es' ? 'Más sobre este tema' : 'More on this topic');

    const mainImage = campaign.imageUrl || "https://placehold.co/1200x500/111/444?text=Master+Hub";

    return (
        <div style={{ fontFamily: '"Inter", "Segoe UI", sans-serif', color: '#111', background: '#fff' }}>

            {/* HERO SECTION */}
            <section style={{
                background: '#0a0a0a',
                color: 'white',
                padding: '4rem 1rem 8rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div className="container" style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 2 }}>

                    {/* BREADCRUMBS */}
                    <nav aria-label="Breadcrumb" style={{ fontSize: '0.85rem', color: '#888', marginBottom: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Link href={`/`} style={{ textDecoration: 'none', color: '#888' }}>Home</Link>
                        <span style={{ margin: '0 0.5rem', opacity: 0.5 }}>/</span>
                        <span style={{ color: '#fff', fontWeight: 500 }}>
                            {SafeRender(campaign.category).charAt(0).toUpperCase() + SafeRender(campaign.category).slice(1)}
                        </span>
                    </nav>

                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                        fontWeight: 800,
                        lineHeight: 1.15,
                        marginBottom: '2rem',
                        letterSpacing: '-0.03em'
                    }}>
                        {SafeRender(campaign.title || campaign.productName)}
                    </h1>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', color: '#aaa', fontSize: '0.9rem' }}>
                        <span>By <strong style={{ color: '#fff' }}>Nexus Team</strong></span>
                        <span>•</span>
                        <span>{date}</span>
                    </div>

                </div>

                {/* Background Gradient */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at 50% 0%, #222 0%, #0a0a0a 70%)', zIndex: 1 }}></div>
            </section>

            {/* HERO IMAGE (OVERLAPPING) */}
            <div className="container" style={{ maxWidth: '1000px', margin: '-6rem auto 0', position: 'relative', zIndex: 3, padding: '0 1rem' }}>
                <div style={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                    background: '#222',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    {mainImage ? (
                        <img
                            src={mainImage}
                            alt={SafeRender(campaign.title)}
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                    ) : (
                        <div style={{ color: '#555', fontSize: '1.5rem', fontWeight: 600, padding: '4rem', textAlign: 'center' }}>No Image Available</div>
                    )}
                </div>
            </div>

            {/* MAIN CONTENT */}
            <main className="container" style={{ maxWidth: '800px', margin: '4rem auto 0', padding: '0 1.5rem 4rem', position: 'relative', zIndex: 10 }}>

                {/* 1. INTRODUCTION */}
                <div style={{ fontSize: '1.15rem', lineHeight: 1.7, marginBottom: '3rem', color: '#333', fontFamily: 'inherit' }}>
                    {/* Parse intro markdown too just in case */}
                    <div dangerouslySetInnerHTML={{ __html: parseMarkdown(campaign.description || "") }} />
                </div>

                {/* 2. FEATURES / ARTICLE BODY */}
                {featuresHtml && (
                    <div dangerouslySetInnerHTML={{ __html: featuresHtml }} />
                )}

                {/* 3. VERDICT / CONCLUSION */}
                {content.verdict && (
                    <div style={{ marginTop: '4rem', padding: '2.5rem', background: '#f0fdf4', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
                        <h2 style={{ marginTop: 0, marginBottom: '1rem', color: '#166534', fontSize: '1.6rem', fontWeight: 700 }}>{lang === 'es' ? 'Veredicto Final' : 'Final Verdict'}</h2>
                        <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content.verdict) }} style={{ fontSize: '1.1rem', lineHeight: 1.7, color: '#14532d' }} />
                    </div>
                )}

            </main>

            {/* CLUSTER / CHILDREN SECTION */}
            {gridItems && gridItems.length > 0 && (
                <section style={{ backgroundColor: '#f8f9fa', padding: '5rem 1rem' }}>
                    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '2px', color: '#8b5cf6', textTransform: 'uppercase' }}>{labelText}</span>
                            <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem', fontWeight: 800 }}>{gridTitle}</h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                            {gridItems.map((child: any) => (
                                <a key={child.slug} href={`/${child.category || 'general'}/${child.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', transition: 'transform 0.2s', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} className="hover-card">
                                    <div style={{ height: '200px', overflow: 'hidden', background: '#f0f0f0' }}>
                                        {child.imageUrl ? (
                                            <img src={child.imageUrl} alt={child.title || child.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)' }} />
                                        )}
                                    </div>
                                    <div style={{ padding: '1.5rem' }}>
                                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>{SafeRender(child.title || child.productName)}</h3>
                                        <p style={{ fontSize: '0.95rem', color: '#666', lineHeight: 1.5 }}>
                                            {SafeRender(child.description ? stripHtml(child.description).substring(0, 100) + '...' : (lang === 'es' ? 'Leer guía completa...' : 'Read full guide...'))}
                                        </p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
