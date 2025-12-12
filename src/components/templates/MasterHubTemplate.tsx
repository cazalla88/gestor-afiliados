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

    // 2. feature parsing robusto (SEARCH IN ALL KEYS)
    // Emergency Fallback: Buscamos el texto en cualquier propiedad probable
    const rawBody = content.features || content.articleBody || content.body || content.text || content.content || "";

    let featuresHtml = "";
    if (typeof rawBody === 'string') {
        featuresHtml = rawBody
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "") // Anti-XSS básico
            .replace(/<h2>/g, '<h2 style="font-size: 1.8rem; margin-top: 2.5rem; margin-bottom: 1.5rem; color: #111;">')
            .replace(/<h3>/g, '<h3 style="font-size: 1.4rem; margin-top: 2rem; margin-bottom: 1rem; color: #333;">')
            .replace(/<p>/g, '<p style="margin-bottom: 1.2rem; line-height: 1.8; font-size: 1.05rem; color: #444;">')
            .replace(/<ul>/g, '<ul style="margin-bottom: 1.5rem; padding-left: 1.5rem;">')
            .replace(/<li>/g, '<li style="margin-bottom: 0.5rem; line-height: 1.6;">');
    }

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


    return (
        <article style={{ fontFamily: 'Inter, sans-serif', color: '#333', backgroundColor: '#fff' }}>

            {/* --- HERO SECTION: FULL WIDTH & CINEMATIC --- */}
            <section style={{ backgroundColor: '#111', color: '#fff', padding: '4rem 1rem 6rem 1rem', textAlign: 'center' }}>
                <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>

                    {/* BREADCRUMBS */}
                    <nav aria-label="Breadcrumb" style={{ fontSize: '0.85rem', color: '#888', marginBottom: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Link href={`/`} style={{ textDecoration: 'none', color: '#888' }}>Home</Link>
                        <span style={{ margin: '0 0.5rem', opacity: 0.5 }}>/</span>
                        <span style={{ color: '#fff', fontWeight: 500 }}>
                            {SafeRender(campaign.category).charAt(0).toUpperCase() + SafeRender(campaign.category).slice(1)}
                        </span>
                    </nav>

                    <h1 style={{
                        fontSize: '3rem',
                        fontWeight: 800,
                        lineHeight: 1.1,
                        marginBottom: '1.5rem',
                        letterSpacing: '-0.02em',
                        background: 'linear-gradient(to right, #fff, #bbb)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        {SafeRender(campaign.title)}
                    </h1>

                    <p style={{ fontSize: '1.25rem', color: '#ccc', maxWidth: '800px', margin: '0 auto 3rem auto', lineHeight: 1.6 }}>
                        {SafeRender(content.introduction).slice(0, 150)}...
                    </p>

                    {/* HERO IMAGE: 21:9 RATIO */}
                    <div style={{
                        maxWidth: '1200px',
                        margin: '0 auto -8rem auto', // Pull image down to overlap sections
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        position: 'relative',
                        aspectRatio: '21/9',
                        backgroundColor: '#222'
                    }}>
                        <img
                            src={campaign.imageUrl || "https://placehold.co/1200x500/111/444?text=Master+Hub"}
                            alt={SafeRender(campaign.title)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                </div>
            </section>

            {/* --- MAIN CONTENT SECTION --- */}
            <div className="container" style={{ maxWidth: '900px', margin: '10rem auto 4rem auto', padding: '0 1.5rem' }}>

                {/* 1. INTRODUCTION */}
                <div style={{ fontSize: '1.15rem', lineHeight: 1.8, marginBottom: '4rem', color: '#222' }}>
                    <div dangerouslySetInnerHTML={{ __html: campaign.description || "" }} />
                </div>

                {/* DEBUG: DUMP CONTENT KEYS */}
                {/* <div style={{ background: '#eee', padding: '1rem', marginBottom: '2rem', fontSize: '0.7rem', overflow: 'auto' }}>
                    <strong>DEBUG DATA (Remove later):</strong>
                    <pre>{JSON.stringify(content, null, 2)}</pre>
                </div> */}

                {/* 2. FEATURES / ARTICLE BODY */}
                {featuresHtml && (
                    <div dangerouslySetInnerHTML={{ __html: featuresHtml }} />
                )}

            </div>

            {/* --- CLUSTER SECTION (SUB-GUIDES OR RELATED) --- */}
            {gridItems && gridItems.length > 0 && (
                <section style={{ backgroundColor: '#f8f9fa', padding: '5rem 1rem' }}>
                    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <span style={{ color: '#7c3aed', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.9rem' }}>
                                {labelText}
                            </span>
                            <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem', color: '#111' }}>
                                {gridTitle}
                            </h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                            {gridItems.map((child: any) => (
                                <Link key={child.slug} href={`/${campaign.category}/${child.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{
                                        backgroundColor: '#fff',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        height: '100%',
                                        border: '1px solid #eee'
                                    }}>
                                        <div style={{ height: '200px', overflow: 'hidden', backgroundColor: '#eee' }}>
                                            {/* SAFETY: Native img for robustness */}
                                            {child.imageUrl && (
                                                <img
                                                    src={child.imageUrl}
                                                    alt={SafeRender(child.title)}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            )}
                                        </div>
                                        <div style={{ padding: '1.5rem' }}>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem 0', lineHeight: 1.3 }}>
                                                {SafeRender(child.title || child.productName)}
                                            </h3>
                                            <p style={{ fontSize: '0.95rem', color: '#666', lineHeight: 1.6, margin: 0 }}>
                                                {SafeRender(child.description).slice(0, 100)}...
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* --- FOOTER REMOVED (Global Footer used instead) --- */}
            {/* <footer style={{ backgroundColor: '#111', color: '#666', padding: '3rem 1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <p>&copy; {new Date().getFullYear()} Nexus Guides. All rights reserved.</p>
                </div>
            </footer> */}
        </article>
    );
}
