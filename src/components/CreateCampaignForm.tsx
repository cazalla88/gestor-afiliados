"use client";

import { useState, useEffect } from "react";
import styles from "./CreateCampaignForm.module.css";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/RichTextEditor";
import { generateSeoContent, debugAiConnection, createCampaign, updateCampaign, getCampaign, analyzeImage, getAllCampaigns } from "@/app/actions";
import { CATEGORIES, type CategorySlug } from "@/lib/categories";
import LandingTemplate from "@/components/templates/LandingTemplate";
import BlogTemplate from "@/components/templates/BlogTemplate";

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
        type: "landing" as "landing" | "blog",
        category: "general" as CategorySlug,
        tone: "Professional"
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isAnalyzingImage, setIsAnalyzingImage] = useState(false); // Vision AI State
    const [showApiKey, setShowApiKey] = useState(true); // <--- SIEMPRE VISIBLE PARA TI
    const [generatedBlogData, setGeneratedBlogData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [existingCampaigns, setExistingCampaigns] = useState<any[]>([]); // SEO Context

    // Load API Key from local storage
    useEffect(() => {
        const storedKey = localStorage.getItem("gemini_api_key");
        if (storedKey) {
            setFormData(prev => ({ ...prev, apiKey: storedKey }));
        }

        // Load campaigns for SEO Auto-Linking context
        getAllCampaigns().then(campaigns => {
            if (Array.isArray(campaigns)) {
                setExistingCampaigns(campaigns);
            }
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
                        type: campaign.type as "landing" | "blog",
                        category: (campaign.category as CategorySlug) || "general",
                        tone: "Professional"
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
            id: slug,
            type: formData.type,
            productName: formData.productName,
            affiliateLink: formData.affiliateLink,
            imageUrl: formData.imageUrl,
            title: formData.type === 'landing' ? formData.productName : generatedBlogData?.title,
            description: formData.type === 'landing' ? formData.description : generatedBlogData?.introduction,
            category: formData.category,
            language: language,
            ...generatedBlogData
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
        }

        setIsOptimizing(true);
        // Pass existingCampaigns for SEO Auto-Linking
        const result = await generateSeoContent(
            formData.productName,
            formData.description,
            formData.apiKey,
            formData.type,
            language,
            formData.tone,
            existingCampaigns
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
                ) : (
                    <BlogTemplate
                        campaign={previewData}
                        currentSlug="preview"
                        relatedProducts={[]}
                    />
                )}
            </div>
        );
    }

    return (
        <div className={styles.formContainer}>
            <div className={styles.header}>
                <h2>{t.form.title}</h2>
                <p>{t.form.subtitle}</p>
            </div>

            <div className={styles.typeSelector}>
                <button
                    type="button"
                    className={`${styles.typeBtn} ${formData.type === 'landing' ? styles.activeType : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'landing' }))}
                >
                    Landing Page
                </button>
                <button
                    type="button"
                    className={`${styles.typeBtn} ${formData.type === 'blog' ? styles.activeType : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'blog' }))}
                >
                    Blog Review
                </button>
            </div>

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

            <div className={styles.aiToggle}>
                <button
                    type="button"
                    className={styles.previewBtn}
                    onClick={handlePreview}
                >
                    👁️ Preview Page
                </button>
                <button
                    type="button"
                    className={styles.aiButton}
                    onClick={handleAiOptimize}
                    disabled={isOptimizing}
                >
                    {isOptimizing ? "✨ Generating Content..." : (formData.type === 'blog' ? "✨ Generate Full Review" : "✨ AI Magic Optimize")}
                </button>
            </div>

            {showApiKey && (
                <div className={styles.inputGroup} style={{ marginBottom: '1rem' }}>
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

            <form onSubmit={handleSubmit} className={styles.form}>
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
                    <RichTextEditor
                        label={formData.type === 'blog' ? "Product/Topic Details & Post Content" : t.form.description}
                        content={formData.description}
                        onChange={(html) => setFormData(prev => ({ ...prev, description: html }))}
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
                            required
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
                                    // Construct rich scraped data for AI context
                                    let scrapedInfo = "";
                                    if (data.description) scrapedInfo += `<p><strong>Official Description:</strong> ${data.description.substring(0, 500)}...</p>`;
                                    if (data.features) scrapedInfo += `<p><strong>Key Specifications:</strong><br/>${data.features.replace(/\n/g, '<br/>')}</p>`;

                                    setFormData(prev => ({
                                        ...prev,
                                        productName: data.title || prev.productName,
                                        imageUrl: data.image || prev.imageUrl,
                                        // Append scraped data to description so AI can use it
                                        description: prev.description ? prev.description + "<br/><hr/>" + scrapedInfo : scrapedInfo
                                    }));
                                }
                            }}
                            className={styles.typeBtn}
                            style={{ padding: '0 1rem', whiteSpace: 'nowrap' }}
                            title="Auto-fill Title, Image & Features from Amazon"
                        >
                            🪄 Auto-Fill & Scrape
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
                                background: 'linear-gradient(135deg, #10b981, #059669)' // Green for Vision
                            }}
                            title="Use AI Vision to describe image"
                        >
                            {isAnalyzingImage ? "👁️ Analyzing..." : "👁️ Analyze Image"}
                        </button>
                    </div>
                </div>

                <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={isSubmitting}>
                    {isSubmitting ? (
                        <span className={styles.loadingSpinner}>{t.form.buttonLoading}</span>
                    ) : (
                        formData.type === 'blog' ? "Publish Review" : t.form.button
                    )}
                </button>
            </form>
        </div>
    );
}
