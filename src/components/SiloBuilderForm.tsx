"use client";

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { generateSeoContent } from '@/app/actions';
// Ensure generateSeoContent is updated to accept the new types, or we ignore TS for legacy string compat
import { createCampaign } from '@/app/actions';

// --- ICONS ---
const IconMaster = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg>;
const IconSubHub = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>;
const IconMoney = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconAuth = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.24 50.552 50.552 0 00-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>;

export default function SiloBuilderForm() {
    const [selectedType, setSelectedType] = useState<'hub_principal' | 'subhub' | 'blog' | 'authority'>('hub_principal');
    const [jsonDetected, setJsonDetected] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        try {
            // Prepare Data
            const title = formData.get('title') as string;
            const slug = formData.get('slug') as string;
            const rawContext = formData.get('context') as string;
            const parentId = formData.get('parentId') as string;

            // Map UI Types to Backend Types
            // 'blog' in backend handles both Money Post (with json) and Authority (with json)
            // 'hub_secundario' is 'subhub'
            let backendType = 'hub_principal';
            if (selectedType === 'subhub') backendType = 'hub_secundario'; // or 'subhub' depending on your actions.ts update
            if (selectedType === 'blog' || selectedType === 'authority') backendType = 'blog';

            // Add hidden markers for Authority if selected
            let finalContext = rawContext;
            if (selectedType === 'authority' && !rawContext.includes('tipo_autoridad')) {
                // Inject a flag if user didn't paste full JSON, to guide AI
                finalContext = JSON.stringify({ tipo_autoridad: "educational_guide", ...JSON.parse(rawContext || "{}") });
            }

            // 1. Generate Content (AI)
            // Note: passing empty strings for unused legacy fields
            const aiResult = await generateSeoContent(
                title,
                finalContext,
                '',
                backendType as any,
                'es'
            );

            if (aiResult.error) throw new Error(aiResult.error);

            // 2. Save to DB
            // Using existing createCampaign action. We might need to adapt it slightly 
            // if it expects specific form data structure, but usually it takes direct args too?
            // Actually, createCampaign is a server action that takes FormData. 
            // So we might need to recreate a FormData object or call a direct DB function.
            // For now, let's assume we re-use the createCampaign logic but properly.

            // Simulating the FormData expected by createCampaign
            const saveFormData = new FormData();
            saveFormData.set('productName', title);
            saveFormData.set('type', backendType);
            saveFormData.set('slug', slug);
            saveFormData.set('description', finalContext);
            saveFormData.set('affiliateLink', '#'); // Placeholder
            if (parentId) saveFormData.set('parentId', parentId);

            // Hack: Append the AI Result as a hidden field or handle inside createCampaign?
            // The current createCampaign calls generateSeoContent internally if not provided.
            // To be safe and clean, we should let createCampaign do the generation 
            // OR we pass the generated content.

            // Let's call createCampaign directly, relying on IT to call the AI.
            // This avoids double generation.
            // We just need to ensure createCampaign uses the correct type.

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

    return (
        <form action={handleSubmit} className="w-full max-w-5xl mx-auto p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl">

            {/* HEADER */}
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Silo Architect <span className="text-amber-400">v2.0</span></h2>
                <p className="text-slate-400">Selecciona tu pieza de contenido para construir la autoridad.</p>
            </div>

            {/* 1. TYPE SELECTOR (CARDS) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

                {/* MASTER HUB */}
                <button
                    type="button"
                    onClick={() => setSelectedType('hub_principal')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 text-center ${selectedType === 'hub_principal'
                            ? 'border-amber-500 bg-amber-500/10 text-white'
                            : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                        }`}
                >
                    <IconMaster />
                    <div>
                        <div className="font-bold">Master Hub</div>
                        <div className="text-xs opacity-70">La Raíz (Padre)</div>
                    </div>
                </button>

                {/* SUB HUB */}
                <button
                    type="button"
                    onClick={() => setSelectedType('subhub')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 text-center ${selectedType === 'subhub'
                            ? 'border-blue-500 bg-blue-500/10 text-white'
                            : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                        }`}
                >
                    <IconSubHub />
                    <div>
                        <div className="font-bold">Sub-Hub</div>
                        <div className="text-xs opacity-70">El Nicho (Hijo)</div>
                    </div>
                </button>

                {/* MONEY POST */}
                <button
                    type="button"
                    onClick={() => setSelectedType('blog')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 text-center ${selectedType === 'blog'
                            ? 'border-emerald-500 bg-emerald-500/10 text-white'
                            : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                        }`}
                >
                    <IconMoney />
                    <div>
                        <div className="font-bold">Money Post</div>
                        <div className="text-xs opacity-70">La Venta (Comparativa)</div>
                    </div>
                </button>

                {/* AUTHORITY POST */}
                <button
                    type="button"
                    onClick={() => setSelectedType('authority')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 text-center ${selectedType === 'authority'
                            ? 'border-purple-500 bg-purple-500/10 text-white'
                            : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                        }`}
                >
                    <IconAuth />
                    <div>
                        <div className="font-bold">Authority</div>
                        <div className="text-xs opacity-70">Educativo (Guía)</div>
                    </div>
                </button>

            </div>

            {/* 2. MAIN INPUTS */}
            <div className="space-y-6">

                {/* TITLE & SLUG */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Título del Contenido (H1)</label>
                        <input
                            name="title"
                            type="text"
                            required
                            placeholder="Ej: Mejores Móviles Baratos 2026"
                            onChange={autoSlug}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">URL Slug (Automático)</label>
                        <div className="flex bg-slate-950 border border-slate-700 rounded-lg overflow-hidden">
                            <span className="bg-slate-900 text-slate-500 p-3 text-sm border-r border-slate-700">/</span>
                            <input
                                id="slugInput"
                                name="slug"
                                type="text"
                                required
                                className="w-full bg-transparent p-3 text-white outline-none placeholder-slate-600"
                                placeholder="mejores-moviles-baratos"
                            />
                        </div>
                    </div>
                </div>

                {/* PARENT SELECTOR (Dynamic) */}
                {selectedType !== 'hub_principal' && (
                    <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            🔗 Asignar Padre (Para crear la ruta SEO)
                        </label>
                        <select
                            name="parentId"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none"
                        >
                            <option value="">-- Selecciona un Hub Padre (Opcional por ahora) --</option>
                            {/* 
                         TODO: Fetch real hubs from DB passed as props or via Server Component wrapper.
                         For now, user can manually set ID or we rely on 'General' 
                      */}
                            <option value="manual_link_later">[Se enlazará automáticamente por Slug si coincide]</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-2">
                            * Al asignar un padre, se crean los Breadcrumbs y esquemas de silo automáticamente.
                        </p>
                    </div>
                )}

                {/* 3. STRATEGY CONTEXT (The Brain) */}
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <label className="block text-sm font-medium text-slate-400">
                            Estrategia / Contexto / Fuente
                        </label>
                        {jsonDetected ? (
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 animate-pulse">
                                ✅ JSON Estratégico Detectado
                            </span>
                        ) : (
                            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                                📝 Modo Texto / Fuente Libre
                            </span>
                        )}
                    </div>

                    <textarea
                        name="context"
                        required
                        onChange={handleContextChange}
                        placeholder={selectedType === 'blog' ? 'Pega el JSON de comparativa O el texto de un artículo fuente...' : 'Define el objetivo del Hub o pega el JSON de estructura...'}
                        className="w-full h-60 bg-slate-950 border border-slate-700 rounded-lg p-4 text-sm text-slate-300 font-mono focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    ></textarea>
                    <p className="text-xs text-slate-500 mt-2">
                        Tip: Pega un JSON (`{... }`) para control total, o texto plano para que la IA lo use de inspiración.
                    </p>
                </div>

                {/* SUBMIT */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${loading
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white transform hover:scale-[1.01]'
                        }`}
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Generando Contenido IA...
                        </span>
                    ) : (
                        "🚀 Generar y Publicar Silo"
                    )}
                </button>

            </div>
        </form>
    );
}
