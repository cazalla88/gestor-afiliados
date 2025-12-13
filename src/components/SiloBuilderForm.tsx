"use client";

import { useState } from 'react';
import { generateSeoContent, createCampaign } from '@/app/actions';

// --- ICONS (Fixed Size SVG) ---
const IconMaster = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
);
const IconSubHub = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
);
const IconMoney = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
);
const IconAuth = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
    </svg>
);

export default function SiloBuilderForm() {
    const [selectedType, setSelectedType] = useState<'hub_principal' | 'subhub' | 'blog' | 'authority'>('hub_principal');
    const [jsonDetected, setJsonDetected] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        try {
            const title = formData.get('title') as string;
            const slug = formData.get('slug') as string;
            const category = formData.get('category') as string || 'general';
            const rawContext = formData.get('context') as string;
            const parentId = formData.get('parentId') as string;

            let backendType = 'hub_principal';
            if (selectedType === 'subhub') backendType = 'hub_secundario';
            if (selectedType === 'blog' || selectedType === 'authority') backendType = 'blog';

            let finalContext = rawContext;
            // Auto-inject authority type if missing from JSON context
            if (selectedType === 'authority' && !rawContext.includes('tipo_autoridad')) {
                try {
                    const parsed = JSON.parse(rawContext || "{}");
                    finalContext = JSON.stringify({ tipo_autoridad: "educational_guide", ...parsed });
                } catch (e) {
                    // If text mode, leave as is
                }
            }

            const aiResult = await generateSeoContent(
                title,
                finalContext,
                '',
                backendType as any,
                'es'
            );

            if (aiResult.error) throw new Error(aiResult.error);

            const saveFormData = new FormData();
            saveFormData.set('productName', title);
            saveFormData.set('type', backendType);
            saveFormData.set('category', category); // Add category to save
            saveFormData.set('slug', slug);
            saveFormData.set('description', finalContext);
            saveFormData.set('affiliateLink', '#');

            // FIX: Only send parentId if it's a real ID, ignore the placeholder "manual_link_later"
            if (parentId && parentId !== 'manual_link_later') {
                saveFormData.set('parentId', parentId);
            }

            await createCampaign(saveFormData);

            alert("¡Contenido Creado con Éxito!");
            window.location.reload();

        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value.trim();
        if (val.startsWith('{') && val.endsWith('}')) {
            setJsonDetected(true);
        } else {
            setJsonDetected(false);
        }
    };

    const autoSlug = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const slug = val.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        const slugInput = document.getElementById('slugInput') as HTMLInputElement;
        if (slugInput) slugInput.value = slug;
    }

    // --- STYLES OBJECTS ---
    const styles = {
        container: {
            background: '#0f0f10',
            padding: '2rem',
            borderRadius: '16px',
            color: '#fff',
            maxWidth: '100%',
            border: '1px solid #27272a'
        },
        header: {
            textAlign: 'center' as const,
            marginBottom: '1rem'
        },
        title: {
            fontSize: '1.8rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            background: 'linear-gradient(90deg, #fff, #aaa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
        },
        subtitle: { color: '#888', fontSize: '0.95rem' },
        categorySection: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            marginBottom: '1.5rem'
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
        },
        card: (isActive: boolean, color: string) => ({
            background: isActive ? `${color}15` : '#18181b',
            border: isActive ? `2px solid ${color}` : '1px solid #333',
            padding: '1.5rem',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            gap: '1rem',
            transition: 'all 0.2s ease',
            color: isActive ? color : '#71717a'
        }),
        input: {
            width: '100%',
            padding: '0.75rem',
            background: '#000',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.95rem',
            outline: 'none',
            fontFamily: 'inherit'
        },
        selectCategory: {
            padding: '0.75rem 1rem',
            background: '#000',
            border: '1px solid #444',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '1rem',
            outline: 'none',
            cursor: 'pointer',
            minWidth: '200px',
            textAlign: 'center' as const
        },
        textarea: {
            width: '100%',
            minHeight: '200px',
            background: '#0a0a0a',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '1rem',
            color: '#d4d4d8',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            outline: 'none',
            resize: 'vertical' as const
        },
        button: {
            width: '100%',
            padding: '1rem',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            cursor: 'pointer',
            marginTop: '1rem',
            transition: 'transform 0.1s'
        },
        label: { display: 'block', fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '0.5rem' },
        tag: {
            fontSize: '0.75rem',
            padding: '0.3rem 0.8rem',
            borderRadius: '6px',
            marginLeft: '0.5rem',
            fontWeight: 'bold',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em'
        }
    };

    return (
        <form action={handleSubmit} style={styles.container}>

            {/* HEADER */}
            <div style={styles.header}>
                <h2 style={styles.title}>Silo Architect <span style={{ color: '#fbbf24' }}>v2.0</span></h2>
                <p style={styles.subtitle}>Selecciona tu pieza de contenido para construir la autoridad.</p>
            </div>

            {/* CATEGORY SELECTOR (CENTERED) */}
            <div style={styles.categorySection}>
                <label style={{ ...styles.label, marginBottom: '0.5rem', color: '#fff' }}>⬇ Categoría ⬇</label>
                <select name="category" style={styles.selectCategory} defaultValue="tecnologia">
                    <option value="tecnologia">Tecnología</option>
                    <option value="hogar">Hogar</option>
                    <option value="deportes">Deportes</option>
                    <option value="moda">Moda</option>
                    <option value="salud">Salud</option>
                    <option value="general">_General (Sin Categoría)</option>
                </select>
            </div>

            {/* 1. TYPE SELECTOR (CARDS) */}
            <div style={styles.grid}>
                {/* MASTER HUB */}
                <div onClick={() => setSelectedType('hub_principal')} style={styles.card(selectedType === 'hub_principal', '#f59e0b')}>
                    <IconMaster />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', color: selectedType === 'hub_principal' ? '#fff' : 'inherit' }}>Master Hub</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Raíz (Padre)</div>
                    </div>
                </div>

                {/* SUB HUB */}
                <div onClick={() => setSelectedType('subhub')} style={styles.card(selectedType === 'subhub', '#3b82f6')}>
                    <IconSubHub />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', color: selectedType === 'subhub' ? '#fff' : 'inherit' }}>Sub-Hub</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Nicho (Hijo)</div>
                    </div>
                </div>

                {/* MONEY POST */}
                <div onClick={() => setSelectedType('blog')} style={styles.card(selectedType === 'blog', '#10b981')}>
                    <IconMoney />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', color: selectedType === 'blog' ? '#fff' : 'inherit' }}>Money Post</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Comparativa</div>
                    </div>
                </div>

                {/* AUTHORITY POST */}
                <div onClick={() => setSelectedType('authority')} style={styles.card(selectedType === 'authority', '#a855f7')}>
                    <IconAuth />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', color: selectedType === 'authority' ? '#fff' : 'inherit' }}>Authority</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Guía Educativa</div>
                    </div>
                </div>
            </div>

            {/* 2. MAIN INPUTS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* TITLE & SLUG */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={styles.label}>Título del Contenido (H1)</label>
                        <input
                            name="title"
                            type="text"
                            required
                            placeholder="Ej: Mejores Móviles Baratos 2026"
                            onChange={autoSlug}
                            style={styles.input}
                        />
                    </div>
                    <div>
                        <label style={styles.label}>URL Slug (Automático)</label>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#000', border: '1px solid #333', borderRadius: '8px' }}>
                            <span style={{ padding: '0.75rem', color: '#555', borderRight: '1px solid #333', fontSize: '0.9rem' }}>/</span>
                            <input
                                id="slugInput"
                                name="slug"
                                type="text"
                                required
                                style={{ ...styles.input, border: 'none', background: 'transparent' }}
                                placeholder="mejores-moviles-baratos"
                            />
                        </div>
                    </div>
                </div>

                {/* PARENT SELECTOR (Dynamic) */}
                {selectedType !== 'hub_principal' && (
                    <div style={{ padding: '1rem', background: '#18181b', borderRadius: '8px', border: '1px border #333 dashed' }}>
                        <label style={styles.label}>
                            🔗 Asignar Padre (Para crear la ruta SEO)
                        </label>
                        <select
                            name="parentId"
                            style={styles.input}
                        >
                            <option value="">-- Selecciona un Hub Padre (Opcional por ahora) --</option>
                            <option value="manual_link_later">[Se enlazará automáticamente por Slug]</option>
                        </select>
                    </div>
                )}

                {/* 3. STRATEGY CONTEXT (The Brain) */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <label style={styles.label}>Estrategia / Contexto / Fuente</label>
                        {jsonDetected ? (
                            <span style={{ ...styles.tag, background: '#064e3b', color: '#34d399', border: '1px solid #059669' }}>
                                ✅ JSON Estratégico Detectado
                            </span>
                        ) : (
                            // HERE IS THE BLUE TAG REQUESTED
                            <span style={{ ...styles.tag, background: 'rgba(37, 99, 235, 0.2)', color: '#60a5fa', border: '1px solid #2563eb' }}>
                                📄 Modo Texto / Fuente Libre
                            </span>
                        )}
                    </div>

                    <textarea
                        name="context"
                        required
                        onChange={handleContextChange}
                        placeholder={selectedType === 'blog' ? 'Pega el JSON de comparativa aquí...' : 'Define el objetivo del Hub...'}
                        style={styles.textarea}
                    ></textarea>
                    <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
                        Pega un JSON (<code>{`{ ... }`}</code>) para activar los modos avanzados.
                    </p>
                </div>

                {/* SUBMIT */}
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        ...styles.button,
                        opacity: loading ? 0.7 : 1,
                        cursor: loading ? 'wait' : 'pointer'
                    }}
                >
                    {loading ? "Generando Contenido IA..." : "🚀 Generar y Publicar Silo"}
                </button>

            </div>
        </form>
    );
}
