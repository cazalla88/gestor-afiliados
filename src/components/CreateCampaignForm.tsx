"use client";

import { useState, useEffect } from "react";
import styles from "./CreateCampaignForm.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/RichTextEditor";
import { generateSeoContent, debugAiConnection, createCampaign, updateCampaign, getCampaign, analyzeImage, getAllCampaigns, getAvailableHubs } from "@/app/actions";
import { CATEGORIES, type CategorySlug } from "@/lib/categories";
import LandingTemplate from "@/components/templates/LandingTemplate";
import BlogTemplate from "@/components/templates/BlogTemplate";
import MasterHubTemplate from "@/components/templates/MasterHubTemplate";

interface CreateCampaignFormProps {
    editSlug?: string;
}

export default function CreateCampaignForm({ editSlug }: CreateCampaignFormProps) {
    const { t, language } = useLanguage();
    const router = useRouter();
    const [formData, setFormData] = useState({
        productName: "",
        description: "",
        affiliateLink: "",
        imageUrl: "",
        apiKey: "",
        type: "blog" as "landing" | "blog" | "hub_principal" | "subhub", // Default is now Blog/Review
        category: "general" as CategorySlug,
        tone: "Professional",
        manualGallery: "",
        contentDepth: "standard" as "standard" | "deep",
        parentId: "" // New Parent Link
    });

    const [hubs, setHubs] = useState<any[]>([]); // New Hubs State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
    const [showApiKey, setShowApiKey] = useState(true);
    const [generatedBlogData, setGeneratedBlogData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [existingCampaigns, setExistingCampaigns] = useState<any[]>([]);

    useEffect(() => {
        const storedKey = localStorage.getItem("gemini_api_key");
        if (storedKey) {
            setFormData(prev => ({ ...prev, apiKey: storedKey }));
        }

        // Load campaigns context
        getAllCampaigns().then(campaigns => {
            if (Array.isArray(campaigns)) setExistingCampaigns(campaigns);
        });

        // NEW: Load available hubs for parent selector
        getAvailableHubs().then(hubsList => {
            if (Array.isArray(hubsList)) setHubs(hubsList);
        });
    }, []);

    // Load existing campaign data if in edit mode
    useEffect(() => {
        if (editSlug) {
            setIsLoading(true);
            getCampaign(editSlug).then(campaign => {
                if (campaign) {
                    setFormData({
                        productName: campaign.productName,
                        description: campaign.description,
                        affiliateLink: campaign.affiliateLink,
                        imageUrl: campaign.imageUrl || "",
                        apiKey: "",
                        type: campaign.type as any,
                        category: (campaign.category as CategorySlug) || "general",
                        tone: "Professional",
                        manualGallery: "",
                        contentDepth: "standard",
                        parentId: (campaign as any).parentId || "" // Load parent
                    });
                }
                setIsLoading(false);
            });
        }
    }, [editSlug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const slug = editSlug || formData.productName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");

        const campaignData = {
            // SPREAD FIRST so explicit fields below overwrite accidental AI hallucinations
            ...generatedBlogData,

            // EXPLICITLY SAVE CONTENT JSON
            content: generatedBlogData,

            id: slug,
            type: formData.type, // FORCE TYPE from selector
            productName: formData.productName,
            affiliateLink: formData.affiliateLink,
            imageUrl: formData.imageUrl,
            manualGallery: formData.manualGallery,
            title: generatedBlogData?.title || formData.productName,
            description: generatedBlogData?.introduction || generatedBlogData?.seoMetaDescription || formData.description,
            category: formData.category,
            language: language,
            parentId: formData.parentId, // Send to backend
        };

        // Update or Create
        const result = editSlug
            ? await updateCampaign(editSlug, campaignData)
            : await createCampaign(campaignData);

        if (result.error) {
            alert("Error saving: " + result.error);
            setIsSubmitting(false);
            return;
        }

        // Redirect to new category-based URL
        router.push(`/${formData.category}/${result.slug || slug}`);
    };

    const handleAiOptimize = async () => {
        if (!formData.productName) {
            alert("Please enter a product name first");
            return;
        }

        if (formData.apiKey) {
            localStorage.setItem("gemini_api_key", formData.apiKey);
            if (formData.type.includes('hub')) {
                // Special Prompt for Hubs could be added here in future
                // For now treating as 'deep' blog
                formData.contentDepth = 'deep';
            }
        }

        setIsOptimizing(true);
        const result = await generateSeoContent(
            formData.productName,
            formData.description,
            formData.apiKey,
            formData.type, // Action now knows about 'hub' types
            language,
            formData.tone,
            existingCampaigns,
            formData.contentDepth
        );

        if (result.error) {
            alert("AI Error: " + result.error + "\n\nTrying to debug connection...");
            const debug = await debugAiConnection(formData.apiKey);
            if (debug.models) {
                alert("Available models found on your key: " + debug.models.join(", "));
            } else {
                alert("Debug Check Failed: " + (debug.error || "Unknown error"));
            }
        } else {
            if (formData.type === 'landing') {
                setFormData(prev => ({
                    ...prev,
                    productName: result.optimizedTitle || prev.productName,
                    description: result.optimizedDescription || prev.description
                }));
            } else {
                setGeneratedBlogData(result);
                alert("Blog Post Generated! Click 'Create' to publish.");
            }
        }
        setIsOptimizing(false);
    };

    const handleImageAnalysis = async () => {
        if (!formData.imageUrl) return alert("Please enter image URL first");
        setIsAnalyzingImage(true);

        const key = formData.apiKey || localStorage.getItem("gemini_api_key") || "";
        const res = await analyzeImage(formData.imageUrl, key);

        if (res.error) {
            alert("Vision AI Error: " + res.error);
        } else if (res.description) {
            // Smartly append
            const newDesc = formData.description
                ? `${formData.description}\n\n<p><strong>✨ Visual Analysis:</strong> ${res.description}</p>`
                : res.description;

            setFormData(prev => ({ ...prev, description: newDesc }));
        }
        setIsAnalyzingImage(false);
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePreview = () => {
        if (!formData.productName) {
            alert("Please enter a product name first");
            return;
        }
        setShowPreview(true);
    };

    if (showPreview) {
        const previewData = {
            id: 'preview-mode',
            slug: 'preview-slug',
            type: formData.type,
            productName: formData.productName,
            title: formData.type === 'landing' ? formData.productName : generatedBlogData?.title || formData.productName,
            description: formData.type === 'landing' ? formData.description : generatedBlogData?.introduction || formData.description,
            affiliateLink: formData.affiliateLink || "#",
            imageUrl: formData.imageUrl,
            galleryImages: formData.manualGallery ? formData.manualGallery.split('\n').filter(u => u.trim().length > 0) : [],
            category: formData.category,
            language: language,
            createdAt: new Date(),
            content: generatedBlogData ? JSON.stringify(generatedBlogData) : null
        };

        return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, overflowY: 'auto', background: 'white' }}>
                <button
                    onClick={() => setShowPreview(false)}
                    style={{
                        position: 'fixed', bottom: '20px', right: '20px', zIndex: 10000,
                        padding: '12px 24px', background: '#111', color: 'white',
                        borderRadius: '50px', border: 'none', fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)', cursor: 'pointer'
                    }}
                >
                    ✏️ Back to Editor
                </button>

                {formData.type === 'landing' ? (
                    <LandingTemplate
                        product={previewData}
                        currentSlug="preview"
                        relatedProducts={[]}
                    />
                ) : (formData.type === 'hub_principal' || formData.type === 'subhub') ? (
                    <MasterHubTemplate
                        campaign={previewData}
                        currentSlug="preview"
                        relatedProducts={[]}
                    />
                ) : (
                    <BlogTemplate
                        campaign={previewData}
                        currentSlug="preview"
                        relatedProducts={[]}
                        isEditable={true}
                        onImageUpdate={(index, newUrl) => {
                            // Index 0 comes from ProductGallery Main Image.
                            // Index -1 comes from Master Hub Banner Paste.
                            if (index === 0 || index === -1) {
                                // Update Main Image
                                setFormData(prev => ({ ...prev, imageUrl: newUrl }));
                            } else {
                                // Update Gallery Images
                                // We need to reconstruct the manualGallery string
                                // 1. Get current gallery array
                                let currentGallery = formData.manualGallery
                                    ? formData.manualGallery.split('\n').filter(url => url.trim().length > 0)
                                    : [];

                                // Ensure array is big enough if user dropped on empty slot 3 while 1 was empty
                                while (currentGallery.length < index) {
                                    currentGallery.push(""); // Fill gaps
                                }

                                // Update specific index (adjusted by -1 since index 0 is mainImage)
                                currentGallery[index - 1] = newUrl;

                                setFormData(prev => ({
                                    ...prev,
                                    manualGallery: currentGallery.join('\n')
                                }));
                            }
                        }}
                    />
                )}
            </div>
        );
    }

    return (
        <div className={styles.formContainer}>
            <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>{t.form.title}</h2>
                    <p>{t.form.subtitle}</p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        const form = document.querySelector(`.${styles.form}`) as HTMLFormElement;
                        if (form) form.requestSubmit();
                    }}
                    className="btn-primary"
                    disabled={isSubmitting}
                    style={{
                        padding: '0.6rem 1.5rem',
                        fontSize: '0.95rem',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                        border: '1px solid #34d399',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    {isSubmitting ? '⏳ Guardando...' : (editSlug ? '💾 GUARDAR CAMBIOS' : '🚀 CREAR AHORA')}
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '2rem' }}>
                <label style={{ color: '#ccc', marginBottom: '0.2rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Fase 1: Define la Estructura</label>

                {/* OPCIÓN 1: HUB PADRE */}
                <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'hub_principal', parentId: '' }))}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                        background: formData.type === 'hub_principal' ? 'linear-gradient(90deg, #7c3aed 0%, #5b21b6 100%)' : '#1e1e24',
                        border: formData.type === 'hub_principal' ? '1px solid #a78bfa' : '1px solid #333',
                        borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                        opacity: formData.type === 'hub_principal' ? 1 : 0.6,
                        boxShadow: formData.type === 'hub_principal' ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none'
                    }}
                >
                    <div style={{ background: '#fff', color: '#7c3aed', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, fontSize: '1.2rem' }}>1</div>
                    <div>
                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>MASTER HUB (Gran Categoría)</div>
                        <div style={{ color: '#ccc', fontSize: '0.85rem' }}>Crea esto <strong>PRIMERO</strong>. Ej: "Todo sobre Cafeteras". <span style={{ color: '#f87171' }}>No selecciones ningún padre abajo.</span></div>
                    </div>
                </button>

                {/* OPCIÓN 2: SUB-HUB */}
                <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'subhub' }))}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                        background: formData.type === 'subhub' ? 'linear-gradient(90deg, #db2777 0%, #9d174d 100%)' : '#1e1e24',
                        border: formData.type === 'subhub' ? '1px solid #f472b6' : '1px solid #333',
                        borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                        opacity: formData.type === 'subhub' ? 1 : 0.6,
                        boxShadow: formData.type === 'subhub' ? '0 4px 12px rgba(219, 39, 119, 0.3)' : 'none'
                    }}
                >
                    <div style={{ background: '#fff', color: '#db2777', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, fontSize: '1.2rem' }}>2</div>
                    <div>
                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>SUB-HUB (Categoría Hija) <span style={{ fontSize: '0.7rem', background: '#333', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px', border: '1px solid #555' }}>OPCIONAL</span></div>
                        <div style={{ color: '#ccc', fontSize: '0.85rem' }}>Para dividir temas grandes. Ej: "Cafeteras Express". <strong>Requiere seleccionar un Hub Padre abajo.</strong></div>
                    </div>
                </button>

                <label style={{ color: '#ccc', margin: '1rem 0 0.2rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Fase 2: Crea el Artículo</label>

                {/* OPCIÓN 3: REVIEW */}
                <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'blog' }))}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                        background: formData.type === 'blog' ? 'linear-gradient(90deg, #10b981 0%, #047857 100%)' : '#1e1e24',
                        border: formData.type === 'blog' ? '1px solid #34d399' : '1px solid #333',
                        borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                        opacity: formData.type === 'blog' ? 1 : 0.6,
                        boxShadow: formData.type === 'blog' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                    }}
                >
                    <div style={{ background: '#fff', color: '#10b981', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, fontSize: '1.2rem' }}>3</div>
                    <div>
                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>PRODUCT REVIEW (Artículo Final)</div>
                        <div style={{ color: '#ccc', fontSize: '0.85rem' }}>El artículo que vende. Ej: "Análisis Cafetera X". <strong>Selecciona su Hub o Sub-hub abajo.</strong></div>
                    </div>
                </button>
            </div>

            {/* PARENT Hub SELECTOR */}
            {(formData.type === 'subhub' || formData.type === 'blog') && hubs.length > 0 && (
                <div className={styles.inputGroup} style={{ marginTop: '1rem', border: '1px solid #334', padding: '1rem', borderRadius: '8px', background: '#1a1a1a' }}>
                    <label htmlFor="parentId" style={{ color: '#db2777', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🔗 Link to Parent Hub (Cluster Strategy)
                    </label>
                    <select
                        id="parentId"
                        name="parentId"
                        value={formData.parentId}
                        onChange={handleChange}
                        className={styles.selectInput}
                        style={{ border: '1px solid #db2777' }}
                    >
                        <option value="">-- No Parent (Root Level) --</option>
                        {hubs.map((hub: any) => (
                            <option key={hub.id} value={hub.id}>
                                {hub.type === 'hub_principal' ? '🌐' : '🔗'} {hub.title} ({hub.slug})
                            </option>
                        ))}
                    </select>
                    <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>
                        Selecting a parent will create automatic breadcrumbs and internal linking silo.
                    </p>
                </div>
            )}

            {formData.type === 'blog' && (
                <div className={styles.typeSelector} style={{ marginTop: '0.5rem', marginBottom: '1.5rem', gap: '0.5rem' }}>
                    <button
                        type="button"
                        className={`${styles.typeBtn} ${formData.contentDepth === 'standard' ? styles.activeType : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, contentDepth: 'standard' }))}
                        style={{
                            fontSize: '0.85rem',
                            padding: '0.4rem 1rem',
                            flex: 1,
                            background: formData.contentDepth === 'standard' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                    >
                        📝 Standard Review
                        <span style={{ display: 'block', fontSize: '0.75em', marginTop: '2px', opacity: 0.7 }}>~800 Words</span>
                    </button>
                    <button
                        type="button"
                        className={`${styles.typeBtn} ${formData.contentDepth === 'deep' ? styles.activeType : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, contentDepth: 'deep' }))}
                        style={{
                            fontSize: '0.85rem',
                            padding: '0.4rem 1rem',
                            flex: 1,
                            background: formData.contentDepth === 'deep' ? 'linear-gradient(135deg, #7c3aed, #db2777)' : 'rgba(255, 255, 255, 0.05)',
                            border: formData.contentDepth === 'deep' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: formData.contentDepth === 'deep' ? 'white' : 'rgba(255, 255, 255, 0.6)'
                        }}
                    >
                        🚀 Pillar Page (Pro)
                        <span style={{ display: 'block', fontSize: '0.75em', marginTop: '2px', opacity: 0.8 }}>2000+ Words (Deep Dive)</span>
                    </button>
                </div>
            )}

            <div className={styles.inputGroup} style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="category">📂 Category (SEO Silo)</label>
                <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={styles.selectInput}
                >
                    {Object.entries(CATEGORIES).map(([key, cat]) => (
                        <option key={key} value={key}>
                            {cat.icon} {cat.name[language as 'en' | 'es']}
                        </option>
                    ))}
                </select>
            </div>



            <form onSubmit={handleSubmit} className={styles.form}>

                {/* LEFT COLUMN: METADATA & ASSETS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div className={styles.inputGroup}>
                        <label htmlFor="productName">{t.form.productName}</label>
                        <input
                            type="text"
                            id="productName"
                            name="productName"
                            className="input-field"
                            placeholder={t.form.productPlaceholder}
                            value={formData.productName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="affiliateLink">{t.form.affiliateLink}</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="url"
                                id="affiliateLink"
                                name="affiliateLink"
                                className="input-field"
                                placeholder={t.form.linkPlaceholder}
                                value={formData.affiliateLink}
                                onChange={handleChange}
                                required={!formData.type.includes('hub')}
                            />
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!formData.affiliateLink) return alert("Paste link first!");
                                    setIsSubmitting(true);
                                    const data = await import("@/app/actions").then(mod => mod.scrapeAmazonProduct(formData.affiliateLink));
                                    setIsSubmitting(false);

                                    if (data.error) {
                                        alert(data.error);
                                    } else {
                                        let scrapedInfo = "";
                                        if (data.description) scrapedInfo += `<p><strong>Official Description:</strong> ${data.description.substring(0, 500)}...</p>`;
                                        if (data.features) scrapedInfo += `<p><strong>Key Specifications:</strong><br/>${data.features.replace(/\n/g, '<br/>')}</p>`;

                                        setFormData(prev => ({
                                            ...prev,
                                            productName: data.productName || prev.productName,
                                            imageUrl: data.imageUrl || prev.imageUrl,
                                            manualGallery: data.manualGallery || prev.manualGallery,
                                            description: prev.description ? prev.description + "<br/><hr/>" + scrapedInfo : scrapedInfo
                                        }));
                                    }
                                }}
                                className={styles.typeBtn}
                                style={{ padding: '0 1rem', whiteSpace: 'nowrap' }}
                                title="Auto-fill"
                            >
                                🪄 Auto-Fill
                            </button>
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="imageUrl">{t.form.image}</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="url"
                                id="imageUrl"
                                name="imageUrl"
                                className="input-field"
                                placeholder={t.form.imagePlaceholder}
                                value={formData.imageUrl}
                                onChange={handleChange}
                            />
                            <button
                                type="button"
                                onClick={handleImageAnalysis}
                                disabled={isAnalyzingImage}
                                className={styles.typeBtn}
                                style={{
                                    padding: '0 1rem',
                                    whiteSpace: 'nowrap',
                                    background: 'linear-gradient(135deg, #10b981, #059669)'
                                }}
                            >
                                {isAnalyzingImage ? "👁️..." : "👁️ Vision"}
                            </button>
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="manualGallery">🖼️ Gallery (One URL per line)</label>
                        <textarea
                            id="manualGallery"
                            name="manualGallery"
                            className="input-field"
                            placeholder="https://example.com/img1.jpg&#10;https://example.com/img2.jpg"
                            value={formData.manualGallery || ""}
                            onChange={handleChange}
                            rows={4}
                            style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                        />
                    </div>

                    {showApiKey && (
                        <div className={styles.inputGroup}>
                            <label htmlFor="apiKey" style={{ color: '#fbbf24' }}>Google Gemini API Key</label>
                            <input
                                type="password"
                                id="apiKey"
                                name="apiKey"
                                className="input-field"
                                value={formData.apiKey}
                                onChange={handleChange}
                            />
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: EDITOR & AI TOOLS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '100%' }}>

                    {/* Action Toolbar */}
                    <div className={styles.toolbar}>
                        <div className={styles.sectionTitle}>
                            <span style={{ fontSize: '1.2em', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' }}>
                                {formData.type === 'blog' ? '📝' : (formData.type.includes('hub') ? '📚' : '📄')}
                            </span>
                            {formData.type === 'blog' ? "Editor de Review" : (formData.type.includes('hub') ? "Editor de Master Hub" : "Editor de Landing Page")}
                        </div>
                        <div className={styles.actionButtons}>
                            <button
                                type="button"
                                className={`${styles.premiumBtn} ${styles.glassBtn}`}
                                onClick={handlePreview}
                            >
                                👁️ Preview
                            </button>
                            <button
                                type="button"
                                className={`${styles.premiumBtn} ${styles.magicBtn}`}
                                onClick={handleAiOptimize}
                                disabled={isOptimizing}
                            >
                                {isOptimizing ? "✨ Escribiendo..." : "✨ AI Magic Writer"}
                            </button>
                        </div>
                    </div>

                    <div className={styles.inputGroup} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <RichTextEditor
                            label=""
                            content={formData.description}
                            onChange={(html) => setFormData(prev => ({ ...prev, description: html }))}
                        />
                        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem', textAlign: 'right' }}>
                            Pro Tip: Use the AI button to generate a 2000+ word draft first, then edit here.
                        </p>
                    </div>
                </div>

                <button
                    type="submit"
                    className={`btn-primary ${styles.submitBtn}`}
                    disabled={isSubmitting}
                    style={{ gridColumn: '1 / -1', marginTop: '1rem', fontSize: '1.2rem', padding: '1rem' }}
                >
                    {isSubmitting ? (
                        <span className={styles.loadingSpinner}>⏳ Guardando...</span>
                    ) : (
                        "💾 GUARDAR Y PUBLICAR"
                    )}
                </button>
            </form >
        </div >
    );
}
