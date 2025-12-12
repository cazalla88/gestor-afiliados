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
        features: "Características Clave",
        pros: "✅ Lo Bueno",
        cons: "❌ Lo Malo",
        comparison: "Comparativa",
        verdict: "Veredicto",
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

// HELPER: Prevent 500 Errors due to "Object as Child"
const SafeRender = (val: any, fallback = "") => {
    if (!val) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
        return val.title || val.text || val.label || JSON.stringify(val);
    }
    return String(val);
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
                if (!feat) return; // SKIP NULLS to prevent 500 Error
                const id = `feat-${count++}`;

                // SUB-CASE A1: String HTML (New Prompt Format)
                if (typeof feat === 'string') {
                    // Extract Title from <h2> or <h3> tags for TOC
                    const titleMatch = feat.match(/<h[23][^>]*>(.*?)<\/h[23]>/);
                    let rawTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : `Section ${count}`;

                    // CLEANER: Detect "Paragraph inside Heading" hallucination
                    let cleanTitle = rawTitle;
                    let overflowContent = "";

                    if (rawTitle.length > 80) {
                        // AI screwed up and put text in H2. Split at first ':' or '.'
                        const splitIndex = rawTitle.search(/[:.]/);
                        if (splitIndex > 3 && splitIndex < 100) {
                            cleanTitle = rawTitle.substring(0, splitIndex).trim(); // Keep meaningful title
                            overflowContent = "<p>" + rawTitle.substring(splitIndex + 1).trim() + "</p>"; // Recovery
                        } else {
                            // Force truncate if no separator found but barely plausible
                            cleanTitle = rawTitle.substring(0, 80) + "...";
                            overflowContent = "<p>" + rawTitle + "</p>";
                        }
                    }

                    // CLEANER: Strip prefixes
                    const finalTitle = cleanTitle
                        .replace(/^\d+\.\s*/, '')
                        .replace(/^(Paso|Step)\s+\d+[:.]?\s*/i, '');

                    headers.push({ id, text: finalTitle });

                    // Inject ID
                    let processedHtml = feat;

                    // Markdown fix
                    processedHtml = processedHtml
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>');

                    if (titleMatch) {
                        // Replace original huge H2 with clean H3 + Overflow content
                        const newHeader = `<h3 id="${id}" style="margin-top: 2.5rem; margin-bottom: 1rem; font-size: 1.6rem; color: #111; border-bottom: 2px solid #f3f4f6; padding-bottom: 0.5rem;">${finalTitle}</h3>${overflowContent}`;
                        processedHtml = processedHtml.replace(titleMatch[0], newHeader);
                    } else {
                        processedHtml = `<h3 id="${id}">${finalTitle}</h3>` + processedHtml;
                    }
                    htmlChunks.push(`<div class="hub-section">${processedHtml}</div>`);
                }
                // SUB-CASE A2: Object Format (Legacy / Fallback)
                else if (typeof feat === 'object' && feat.title) {
                    let desc = (feat.description || "")
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

                    headers.push({ id, text: feat.title });
                    htmlChunks.push(`
                        <div class="hub-section">
                            <h3 id="${id}" style="margin-top: 2.5rem; margin-bottom: 1rem; font-size: 1.6rem; color: #111; border-bottom: 2px solid #f3f4f6; padding-bottom: 0.5rem;">
                                ${feat.title}
                            </h3>
                            <div style="font-size: 1.05rem; line-height: 1.8; color: #374151;">
                                ${desc}
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
        <div className="container" style={{ padding: '4rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1>🛡️ DEBUG SAFE MODE</h1>
            <h2 style={{ color: '#666' }}>{SafeRender(campaign.title)}</h2>
            <hr />
            <p>Si ves esto, el error estaba en el HTML complejo. Vamos a reactivar secciones una a una.</p>

            {/* TEST 1: HERO DESCRIPTION */}
            <div dangerouslySetInnerHTML={{ __html: campaign.description || "" }} />

            {/* TEST 2: FEATURES */}
            <div dangerouslySetInnerHTML={{ __html: featuresHtml || "<p>⚠️ No features content found.</p>" }} />
        </div>
    );
}

