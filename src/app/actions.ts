"use server";
// Force Vercel Deploy - Updated Groq Model 3.3
// DEPLOY TIMESTAMP: 2025-12-11 T 14:32 - FIX HUB SAVING & AMAZON BUTTONS
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
// @ts-ignore
import googleTrends from 'google-trends-api';
import Groq from "groq-sdk";
import { searchProductImages, searchWebContext } from "@/lib/google-search";
import { requestIndexing } from "@/lib/google-indexing";

export async function debugAiConnection(apiKey: string) {
  let finalApiKey = apiKey;

  if (!finalApiKey) {
    if (process.env.GROQ_API_KEY) finalApiKey = process.env.GROQ_API_KEY;
    else if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) finalApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    else if (process.env.GOOGLE_API_KEY) finalApiKey = process.env.GOOGLE_API_KEY;
  }

  if (!finalApiKey) return { error: "No API Key found in request or environment variables (GROQ_API_KEY, GOOGLE_API_KEY)." };

  // Check provider based on key format or precedence
  const isGroq = finalApiKey.startsWith('gsk_') || (!apiKey && process.env.GROQ_API_KEY);

  if (isGroq) {
    try {
      const groq = new Groq({ apiKey: finalApiKey });
      // Simple call to list models or just verify connection
      const models = await groq.models.list();
      return { models: models.data.map(m => m.id) };
    } catch (e: any) {
      return { error: "Groq Error: " + e.message };
    }
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${finalApiKey}`);
    const data = await response.json();

    if (data.error) {
      return { error: data.error.message };
    }

    if (!data.models) {
      return { error: "No models returned from API." };
    }

    const modelNames = data.models
      .map((m: any) => m.name.replace('models/', ''))
      .filter((n: string) => n.includes('gemini'));

    return { models: modelNames };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function analyzeImage(imageUrl: string, apiKey: string) {
  // Check for Groq FIRST
  let finalApiKey: string | undefined = apiKey;
  let provider = 'google';

  // FORCE GOOGLE FOR VISION (Groq Vision is deprecated/unstable)
  provider = 'google'; // Override

  if (apiKey?.startsWith('gsk_')) {
    // If user manually forced a Groq key, we map it to Google Env Key if available
    finalApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  } else {
    finalApiKey = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  }

  if (!finalApiKey) return { error: "API Key Missing. Please add it in the form or Vercel env vars." };

  try {
    // GROQ VISION REMOVED (Deprecated) - Proceeding to Google Gemini
    // if (provider === 'groq') { ... }

    // GOOGLE GEMINI FALLBACK
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error("Failed to fetch image");
    const arrayBuffer = await imgRes.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = imgRes.headers.get("content-type") || "image/jpeg";

    const genAI = new GoogleGenerativeAI(finalApiKey);

    // Retry Logic for Vision
    const modelsToTry = [
      "gemini-2.0-flash-lite-preview-02-05",
      "gemini-2.0-flash",
      "gemini-2.0-pro-exp-02-05",
      "gemini-2.5-flash",
      "gemini-1.5-flash"
    ];

    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = "Describe this product image in detail for a sales page. Focus on materials, design, and key visible features. Be concise (max 3 sentences).";

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          }
        ]);
        const response = await result.response;
        return { description: response.text() };
      } catch (e: any) {
        console.warn(`Vision Model ${modelName} failed: ${e.message}`);
        lastError = e;
        continue;
      }
    }
    throw lastError || new Error("All vision models failed");
  } catch (e: any) {
    console.error("Vision AI Error:", e);
    return { error: `Could not analyze image (${provider}). Details: ${e.message}` };
  }
}

// REFACTORED: ROBUST WATERFALL STRATEGY (Google -> Groq)
export async function generateSeoContent(
  productName: string,
  basicDescription: string,
  apiKey: string,
  type: 'landing' | 'blog' | 'hub_principal' | 'hub_secundario' | 'subhub' = 'landing',
  language: 'en' | 'es' = 'en',
  tone: string = 'Professional',
  existingCampaigns: any[] = [],
  contentDepth: 'standard' | 'deep' = 'standard'
) {
  // 1. RESOLVE KEYS SEPARATELY & FIX CROSS-CONFIGURATION
  // Start with Environment Variables
  let googleKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  let groqKey = process.env.GROQ_API_KEY || "";

  // Override with User Input if provided
  if (apiKey) {
    if (apiKey.startsWith('gsk_')) groqKey = apiKey;
    else googleKey = apiKey;
  }

  // CRITICAL FIX: Check if Google Key is actually a Groq Key (User misconfiguration)
  if (googleKey.startsWith('gsk_')) {
    console.warn("⚠️ Detectada Clave de Groq en variable de Google. Corrigiendo...");
    groqKey = googleKey;
    googleKey = ""; // Invalidate Google path to prevent 404/Auth errors
  }


  // PREPARE PROMPT (Common for both)
  const langName = language === 'es' ? 'Spanish' : 'English';

  // AGENTIC RESEARCH: FETCH REDDIT CONTEXT
  let redditContext = "";
  if (type === 'blog') {
    try {
      console.log(`🕵️ Agentic Research: Checking Reddit for ${productName}...`);
      const results = await searchWebContext(`site:reddit.com ${productName} review problems`, 3);
      if (results.length > 0) {
        redditContext = `
            REAL-WORLD USER OPINIONS (SOURCE: REDDIT):
            ${results.join("\n")}
            
            MANDATORY INSTRUCTION: You MUST reference these specific user complaints or praises in the 'Pros/Cons' or 'Verdict' section to make the review authentic.
            `;
      }
    } catch (e) {
      console.warn("Agentic Research Failed:", e);
    }
  }

  const campaignsContext = existingCampaigns.length > 0
    ? `
    CONTEXT - EXISTING CONTENT ON SITE (For Internal Linking):
    ${JSON.stringify(existingCampaigns.map(c => ({ title: c.productName, category: c.category, slug: c.slug })))}
    MANDATORY SEO INSTRUCTION:
    If relevant, include them in "internalLinks" array.
    `
    : "";

  const COPYWRITING_MASTER_INSTRUCTIONS = `
    MASTER COPYWRITING FRAMEWORKS & INSTRUCTIONS(AUTHORITY MODE):

  1. ** THE "SLIPPERY SLIDE"(Joseph Sugarman):**
    - The sole purpose of the first sentence is to get you to read the second sentence.
       - Use short, punchy sentences.Create curiosity gaps.
    
    2. ** P.A.S.T.O.R.FRAMEWORK(Ray Edwards) - APPLY THIS TO THE INTRODUCTION:**
       - ** P ** roblem: Identify the pain point the user faces.
       - ** A ** gitate: Make it visceral.What happens if they don't solve it?
    - ** S ** olution: Introduce the product as the hero.
       - ** T ** ransformation: Describe the "After" state(emotional relief).
       - ** O ** ffer: What they get.
       - ** R ** esponse: Call to action.

    3. ** SCIENTIFIC ADVERTISING(Claude Hopkins):**
    - BE SPECIFIC.Never say "best quality," say "made with aerospace-grade aluminum."
      - Avoid hype.Use facts to sell.

    4. ** CIALDINI'S PERSUASION TRIGGERS:**
    - ** Social Proof:** Mention "thousands of happy users" or Reddit consensus.
       - ** Scarcity / Urgency:** "Often out of stock due to demand."
    - ** Authority:** Speak with absolute confidence, like an expert engineer.

    5. ** TONE GUIDELINES:**
    - Write to ONE person(Use "You").
       - Benefits OVER Features(Don't sell the drill, sell the hole).
      - Emotional Connection: How does this product make them FEEL ? (Confident, Secure, Smart).
  `;

  const SALES_STORYTELLING_FRAMEWORK = `
      [DEPRECATED - REPLACED BY MASTER COPYWRITING INSTRUCTIONS ABOVE]
      `;

  let prompt = "";

  // --- NEW: MASTER HUB & SUB-HUB LOGIC (Universal Expert Authority) ---
  // --- 3. MASTER HUB STRATEGY (The "Silo" Core) ---
  // --- NEW: MASTER HUB & SUB-HUB LOGIC (Universal Expert Authority) ---
  // --- 3. MASTER HUB STRATEGY (The "Silo" Core) ---
  if (type === 'hub_principal') {
    prompt = `
      ROLE: You are the Editor-in-Chief of a world-renowned Tech Publication (like The Verge, Wirecutter, or Xataka). You are a cynical, highly experienced expert who hates marketing fluff.
      
      GOAL: Write the definitive, authoritative "Buying Guide 2026" for the Master Hub: "${productName}".
      This page is the SEO PILLAR of the website. It serves as a ROUTER to direct traffic to specific sub-categories.

      TONE: 
      - Authoritative, Critical, Expert.
      - Conversational but Professional ("Tú" in Spanish).
      - NO FLUFF. Every sentence must add value. If it's filler, DELETE IT.
      - OPINIONATED. Don't be neutral. Guide the user. Tell them what matters.
      
      LANGUAGE: ${langName} (CRITICAL: Output must be 100% in ${langName}).
      CURRENCY: EUROS (€) ONLY.
      MARKET: SPAIN/EUROPE.

      STRUCTURE & CONTENT REQUIREMENTS (STRICT - Write this inside 'articleBody'):
      
      (Note: 'introduction' field handles the Hook. 'articleBody' handles the rest).

      1. **SECTION 1: THE QUICK MAP (Router)**
         - Title: "## Qué vas a encontrar aquí"
         - Create a bullet list acting as a directory:
           * "Si buscas lo más barato posible → [Ir a Baratos]"
           * "Si buscas calidad/precio → [Ir a Gama Media]"
           * "Si eres [Perfil 1] → [Ir a Opción]"
           (Use markdown links. If URL unknown, use #).

      2. **SECTION 2: BUDGET (The Truth)**
         - Title: "## Presupuesto: Qué esperas por lo que pagas"
         - Explain price ranges (Low, Mid, High) and the "Sweet Spot".
         - Use H3 headers for ranges.

      3. **SECTION 3: USER PROFILES**
         - Title: "## Dime quién eres y te diré qué comprar"
         - Define 3-5 vivid personas (Student, Pro, Casual, etc.).
         - Tell each one what to look for.

      4. **SECTION 4: THE GREAT DEBATE**
         - Title: "## El Gran Debate: [Topic A] vs [Topic B]"
         - Analyze the main dichotomy of this niche (e.g. Android vs iPhone, OLED vs QLED).
         - Be objective but give a winner.

      5. **SECTION 5: SPECS DECODED**
         - Title: "## Especificaciones: Qué importa y qué es humo"
         - Decode the technical sheet. Ignore vanity metrics.

      6. **SECTION 6: ROOKIE MISTAKES**
         - Title: "## Errores de Novato"
         - List common ways people waste money in this niche.

      7. **SECTION 7: FAQ**
         - Title: "## Preguntas Frecuentes"
         - Real questions, direct answers.

      OUTPUT FORMAT (JSON):
      {
        "title": "Guía ${productName} 2026: Qué necesitas de verdad",
        "seoMetaDescription": "La guía definitiva de ${productName} para 2026. Presupuestos, perfiles y recomendaciones honestas.",
        "keyTakeaways": "<ul><li><strong>Takeaway 1:</strong>...</li><li><strong>Takeaway 2:</strong>...</li><li><strong>Takeaway 3:</strong>...</li></ul>",

        "introduction": "<p><strong>(HOOK ONLY).</strong> 3-5 lines. Address the user's pain/confusion directly. Do not repeat title.</p>",
        
        "articleBody": "## Qué vas a encontrar aquí\n(Router content...)\n\n## Presupuesto: Qué esperas por lo que pagas\n(Budget content...)\n\n## Dime quién eres y te diré qué comprar\n(Profiles content...)\n\n## El Gran Debate\n(Debate content...)\n\n## Especificaciones\n(Specs content...)\n\n## Errores de Novato\n(Mistakes content...)\n\n## Preguntas Frecuentes\n(FAQ content...)",

        "verdict": "<p><strong>Veredicto del Editor:</strong> Resumen final de 4-6 líneas. Cierra con autoridad.</p>",
        "targetAudience": "From bargain hunters to power users.",
        "internalLinks": [
           { "anchorText": "Mejores ${productName} Baratos", "slug": "baratos", "category": "${type === 'hub_principal' ? productName.toLowerCase() : 'general'}" },
           { "anchorText": "${productName} Gama Alta", "slug": "gama-alta", "category": "${type === 'hub_principal' ? productName.toLowerCase() : 'general'}" }
        ]
      }
    `;
  }
  else if (type === 'hub_secundario') {
    prompt = `
      ROLE: You are the same cynical, expert Editor-in-Chief.
      OBJETIVO: Write a SUB-HUB GUIDE for the niche: "${productName}".

      CONTEXT & STRATEGY DATA (Critical):
      """
      ${basicDescription}
      """
      
      INSTRUCTION FOR CONTEXT:
      1. Check if the "CONTEXT & STRATEGY DATA" above is a JSON object (containing 'money_posts', 'authority_posts', etc.).
      2. IF IT IS JSON: You MUST use the EXACT 'nombre' and 'url' from that JSON for all your links. DO NOT INVENT LINKS or SLUGS.
      3. IF IT IS NOT JSON: Generate the content based on your knowledge of the niche "${productName}".

      This is NOT a product comparison. It is a GUIDE to the SEGMENT.
      Goal: Help the user decide if this segment is for them and route them to specific comparisons (Money Posts).

      TONE: Direct, Critical, No Fluff. 100% ${langName}.
      CURRENCY: EUROS (€).

      STRUCTURE (Write inside 'articleBody'):

      1. **INTRO (The Hook)**
         - Title: "## Para quién es esta guía"
         - Define clearly what "${productName}" means.
         - Mention the price range if provided in JSON context.

      2. **RANGES/SEGMENTS**
         - Title: "## Rangos dentro de este nicho"
         - Break it down (e.g. Low vs Mid vs High).
         - AT THE END OF EACH SUB-SECTION: Link to the specific "Money Post" from the JSON context (if available).

      3. **CRITERIA (What matters)**
         - Title: "## Qué priorizar (y qué da igual)"
         - Technical specs that matter.
         - Link to "Authority Posts" from JSON if relevant.

      4. **USER PROFILES**
         - Title: "## Perfiles Típicos"
         - Give specific advice for profiles.
         - Link to "subhubs_relacionados" from JSON if relevant.

      5. **ROOKIE MISTAKES**
         - Title: "## Errores Típicos"
         - List 4-6 common ways to waste money.

      6. **FAQ**
         - Title: "## Preguntas Frecuentes"
         - Specific to this sub-niche.

      7. **FINAL CTA**
         - Title: "## Y ahora, ¿qué hago?"
         - Summary and Direct links to the MAIN "Money Posts" from the JSON.
         - Use the exact anchor texts provided in the JSON.

      OUTPUT FORMAT (JSON):
      {
        "title": "${productName} 2026: La Guía Definitiva",
        "seoMetaDescription": "Todo sobre ${productName} en 2026. Análisis de precios, perfiles y recomendaciones.",
        "keyTakeaways": "<ul><li><strong>Takeaway 1:</strong>...</li><li><strong>Takeaway 2:</strong>...</li><li><strong>Takeaway 3:</strong>...</li></ul>",
        
        "introduction": "<p><strong>(HOOK only).</strong> 3-5 lines definining the niche.</p>",

        "articleBody": "## Para quién es esta guía\n(Intro content...)\n\n## Rangos dentro de este nicho\n(Ranges content + Links to Money Posts...)\n\n## Qué priorizar (y qué da igual)\n(Criteria content + Links to Authority Posts...)\n\n## Perfiles Típicos\n(Profiles content + Links to Related Subhubs...)\n\n## Errores Típicos\n(Mistakes...)\n\n## Preguntas Frecuentes\n(FAQ...)\n\n## Y ahora, ¿qué hago?\n(CTA Content with Final Links to Money Posts...)",

        "verdict": "<p><strong>Conclusión del Experto:</strong> Resumen final de autoridad.</p>",
        "targetAudience": "Niche specific audience.",
        "internalLinks": [] 
      }
      (NOTE: Populate 'internalLinks' array with the links you used in the text, using the exact URLs from the JSON context).
    `;
  }
  else if (type === 'blog') {
    // --- SPECIAL LOGIC: DETECT "MONEY POST" OR "AUTHORITY POST" JSON STRATEGY ---
    let strategyType = 'standard'; // standard | money_post | authority_post

    try {
      if (basicDescription.trim().startsWith('{')) {
        if (basicDescription.includes('productos')) {
          strategyType = 'money_post';
        } else if (basicDescription.includes('tipo_autoridad') || basicDescription.includes('posts_dinero_relacionados')) {
          strategyType = 'authority_post';
        }
      }
    } catch (e) { }

    if (strategyType === 'money_post') {
      prompt = `
            ROLE: You are the Editor-in-Chief of a top Tech Site (Wirecutter style).
            GOAL: Write a HIGH-CONVERTING COMPARISON GUIDE (Money Post) for "${productName}".
            
            DATA JSON (STRICT SOURCE OF TRUTH):
            """
            ${basicDescription}
            """

            CRITICAL INSTRUCTION:
            - You MUST use the "DATA JSON" above for ALL product details, links, and names.
            - DO NOT invent products. Use ONLY the ones in the 'productos' array.
            - DO NOT invent prices. Use vague terms ("budget-friendly").

            STRUCTURE (Write inside 'articleBody'):

            1. **INTRO (H2)**
               - 2-4 short paragraphs.
               - Who is this for? What is the price range?
               - Don't sell yet.

            2. **QUICK SUMMARY (H2)**
               - Title: "## Resumen rápido: los ganadores"
               - List 2-4 top picks from the JSON (Best Overall, Best Budget).
               - One line summary + "Ideal for X".

            3. **HOW WE CHOSE (H2)**
               - Explain criteria (Performance, Price, etc.).
               - Link to at least 1 'authority_post' from JSON (using exact URL).

            4. **PRODUCT ANALYSIS (H2)**
               - Title: "## Análisis de cada modelo"
               - FOR EACH PRODUCT in 'productos' array from JSON, create an H3 section:
                 ### [Product Name]
                 - **Resumen:** 1 paragraph.
                 - **Para quién SÍ:** Bullet list (from 'perfil_ideal').
                 - **Para quién NO:** Bullet list (from 'no_recomendado_para').
                 - **Lo Mejor:** Bullets (from 'puntos_fuertes').
                 - **Lo Peor:** Bullets (from 'puntos_debiles').
                 - **Specs:** Key specs list.
                 - **CTA:** "Ver precio en tienda" (Use 'url_afiliado' from JSON).

            5. **BUYING GUIDE (H2)**
               - Title: "## Qué modelo elegir según tu caso"
               - Sub-sections (H3) for specific scenarios (e.g. "If you want cheapest...").
               - Recommend specific products from the list.

            6. **FAQ (H2)**
               - 4-7 real questions. Link to Hub/Subhub if relevant.

            7. **VERDICT (H2)**
               - Final summary.
               - Repeat Top 2 recommendations with affiliate links.

            OUTPUT FORMAT (JSON):
            {
               "title": "Use 'titulo_post' from JSON or '${productName}'",
               "seoMetaDescription": "Comparison summary...",
               "keyTakeaways": "<ul><li><strong>Top Pick:</strong>...</li><li><strong>Budget Pick:</strong>...</ul>",
               "introduction": "<p><strong>(Hook).</strong> Short intro.</p>",
               "articleBody": "## Resumen rápido: los ganadores\n(Content...)\n\n## Análisis de cada modelo\n(Product 1... Product 2...)\n\n## Qué modelo elegir\n(Guide...)\n\n## Preguntas Frecuentes\n(FAQ...)\n\n## Veredicto Final\n(Verdict...)",
               "verdict": "<p><strong>Editor's Choice:</strong> Final recommendation.</p>",
               "targetAudience": "Buyers looking for ${productName}.",
               "internalLinks": []
            }
        `;
    }
    else if (strategyType === 'authority_post') {
      prompt = `
            ROLE: You are the Editor-in-Chief. Expert, Direct, No Fluff.
            GOAL: Write an AUTHORITY GUIDE (Educational) for "${productName}".
            OBJECTIVE: Educate the user so they can choose wisely in the Money Posts. Do NOT sell directly here.

            DATA JSON (STRICT SOURCE OF TRUTH):
            """
            ${basicDescription}
            """

            CRITICAL INSTRUCTION:
            - Use ONLY URLs/Titles from JSON. Do not invent links.
            - Do NOT compare specific products (that's for Money Posts).

            STRUCTURE (Write inside 'articleBody'):

            1. **INTRO (H2)**
               - Why is this topic confusing? What will value will user get?
               - Mention HUB url naturally.

            2. **STEP 1: BUDGET (H2)**
               - Why start here? Explain price tiers.
               - Link to 'subhubs_por_presupuesto' from JSON.

            3. **STEP 2: USE CASE (H2)**
               - Explain different user needs.
               - Link to 'subhubs_por_uso'.

            4. **STEP 3: TYPES/ECOSYSTEMS (H2)**
               - Big decisions (e.g. Android vs iPhone).
               - Link to 'subhubs_por_tipo'.

            5. **SPECS DECODED (H2)**
               - Explain technical concepts (RAM, Hz, etc) simply.
               - What matters vs What is marketing fluff.

            6. **ROOKIE MISTAKES (H2)**
               - 5-7 common buying errors.

            7. **SCENARIOS (H2)**
               - Title: "## Qué haría yo en tu lugar"
               - 3-5 concrete cases ("I have low budget", "I want best camera").
               - Route to specific Money Posts or Sub-Hubs.

            8. **NEXT STEPS (H2)**
               - Summary.
               - Final list of recommended links (Sub-Hubs + Money Posts).

            OUTPUT FORMAT (JSON):
            {
               "title": "Use 'titulo_post' from JSON or '${productName}'",
               "seoMetaDescription": "Educational guide...",
               "keyTakeaways": "<ul><li><strong>Tip 1:</strong>...</li><li><strong>Tip 2:</strong>...</ul>",
               "introduction": "<p><strong>(Hook).</strong> Short intro.</p>",
               "articleBody": "## Paso 1: Presupuesto\n(Content...)\n\n## Paso 2: Uso\n(Content...)\n\n## Especificaciones\n(Content...)\n\n## Qué haría yo en tu lugar\n(Content...)\n\n## Siguientes pasos\n(Content...)",
               "verdict": "<p><strong>Expert Advice:</strong> Final thought.</p>",
               "targetAudience": "Users researching ${productName}.",
               "internalLinks": []
            }
        `;
    }
    else if (contentDepth === 'deep') {
      // --- OPTION A: PILLAR PAGE (Standard Blog) ---
      prompt = `
            Act as a LEGENDARY Direct Response Copywriter.
            Your goal is to write a ** PILLAR PAGE REVIEW ** that converts cold traffic into obsessed buyers.
            ** AUTHORITY LEVEL: GOD MODE.Write with absolute confidence.**

    INPUT DATA:
  Product: "${productName}"
            Raw Details: "${basicDescription}"
  Tone: ${tone}
  Language: ${langName}

            ${campaignsContext}
            ${redditContext}
            ${COPYWRITING_MASTER_INSTRUCTIONS}

            CRITICAL STRUCTURE INSTRUCTIONS(HIT 2000 WORDS):
  1. ** INTRODUCTION(Use P.A.S.T.O.R.Framework):** Hook them immediately. 
            2. ** DEEP DIVES:** Break down the product into 5 distinct sections.Use "Slippery Slide" narrative flow.
            3. ** COMPARISON:** position this product as the * smart * choice.
            4. ** FAQ SECTION:** Answer objections before they arise.

            Generate strict JSON:
  {
    "title": "A Magnetic Headline (Use Numbers, Curiosity, or Strong Benefit)",
      "heroDescription": "Meta-description that forces a click (max 160 chars).",
        "introduction": "An engaging 500-word P.A.S.T.O.R. opener. Make them feel the problem before offering the solution.",
          "targetAudience": "Detailed persona analysis (200 words).",
            "quantitativeAnalysis": "Comprehensive Scoring Breakdown (300 words). Be specific like Claude Hopkins.",
              "pros": ["Benefit-focused Pro 1", "Benefit-focused Pro 2", "Benefit-focused Pro 3", "Benefit-focused Pro 4", "Benefit-focused Pro 5"],
                "cons": ["Honest Flaw 1 (Builds Trust)", "Honest Flaw 2", "Honest Flaw 3"],
                  "features": "THE CORE REVIEW. Write 5 distinct headers/sections using Markdown (### Header). Focus on the 'Transformation' (Benefits). Total approx 800 words.",
                    "comparisonTable": [
                      { "name": "${productName}", "price": "€€€", "rating": "REALISTIC (e.g. 8.7)", "mainFeature": "Killer Feature" },
                      { "name": "Rival", "price": "€€", "rating": "LOWER", "mainFeature": "Alternative" }
                    ],
                      "internalLinks": [{ "slug": "slug", "category": "cat", "anchorText": "text" }],
                        "verdict": "A 400-word Final Verdict. Use Cialdini's Authority. Tell them clearly whether to buy or not."
  }
  IMPORTANT: 'rating' MUST vary(7.5 - 9.8).
    IMPORTANT: Use \\n\\n FREQUENTLY to break up walls of text.
            Return ONLY valid JSON string.No markdown block.
        `;
    } else {
      // --- OPTION B: STANDARD REVIEW (800-1000 Words) ---
      prompt = `
  Act as a SENIOR MASTER Copywriter(Specialized in High - Ticket Sales).
            Your goal is to write a ** HIGH - CONVERSION REVIEW ** (No fluff, pure persuasion).
            ** AUTHORITY LEVEL: EXPERT.Do not use hedging language.**

    INPUT DATA:
  Product: "${productName}"
            Raw Details: "${basicDescription}"
  Tone: ${tone}
  Language: ${langName}

            ${campaignsContext}
            ${redditContext}
            ${COPYWRITING_MASTER_INSTRUCTIONS}

            Generate strict JSON:
  {
    "title": "Clear, Benefit-Driven Headline",
      "heroDescription": "Meta description (max 160 chars).",
        "introduction": "Engaging P.A.S.T.O.R. Intro (200 words). Hook and Agitate problem.",
          "targetAudience": "Who is this for? (50 words).",
            "quantitativeAnalysis": "Quick Score Explanation (100 words).",
              "pros": ["Benefit 1", "Benefit 2", "Benefit 3"],
                "cons": ["Flaw 1", "Flaw 2"],
                  "features": "Key Features Overview (300 words). Use bullet points and specific facts (Scientific Advertising).",
                    "comparisonTable": [
                      { "name": "${productName}", "price": "€€", "rating": "REALISTIC", "mainFeature": "Key Feature" },
                      { "name": "Competitor", "price": "€€", "rating": "LOWER", "mainFeature": "Alternative" }
                    ],
                      "internalLinks": [{ "slug": "slug", "category": "cat", "anchorText": "text" }],
                        "verdict": "Clear Verdict (150 words). Buy or Pass?"
  }
  IMPORTANT: 'rating' MUST vary(7.5 - 9.8).
    IMPORTANT: 'price' MUST be keys: '€', '€€', '€€€'.
            Return ONLY valid JSON string.No markdown block.
        `;
    }
  } else {
    prompt = `Act as Copywriter.Product: "${productName}".Details: "${basicDescription}".Lang: ${langName}. Generate JSON: { "optimizedTitle": "...", "optimizedDescription": "..." } `;
  }

  let lastError: string = "";

  console.log("🚀 DEBUG: Type received:", type);
  console.log("📝 DEBUG: Prompt Preview:", prompt.substring(0, 500) + "...");
  console.log("🔐 DEBUG: Using Google Key:", googleKey ? "YES" : "NO", "Groq Key:", groqKey ? "YES" : "NO");

  // --- PHASE 1: TRY GOOGLE GEMINI (Priority with Multi-Key Failover) ---
  // SECURITY UPDATE: Using Server-Side Pool (GEMINI_API_KEYS_POOL)
  // This prevents keys from being exposed in NEXT_PUBLIC_ client bundles.
  const serverPool = process.env.GEMINI_API_KEYS_POOL || process.env.GOOGLE_API_KEY;
  const publicKeys = googleKey; // Fallback from function args

  // Combine keys (Server > Public)
  const allKeysSource = serverPool ? `${serverPool},${publicKeys || ''}` : publicKeys;

  if (allKeysSource) {
    // Split keys by comma & Clean up
    const apiKeys = allKeysSource.split(',').map(k => k.trim()).filter(k => k.length > 0 && !k.includes("YOUR_KEY"));
    const uniqueKeys = Array.from(new Set(apiKeys));

    if (uniqueKeys.length === 0) {
      console.error("❌ No valid API Keys found in POOL. Check Vercel Env Vars.");
    } else {
      const googleModels = [
        "gemini-1.5-flash",           // Primary
        "gemini-1.5-pro",             // Backup
      ];

      // KEY ROTATION LOOP
      for (const currentKey of uniqueKeys) {
        // Obfuscate log
        const safeKeyLog = "..." + currentKey.slice(-4);
        console.log(`🔑 Testing API Key: ${safeKeyLog}`);

        for (const modelName of googleModels) {
          try {
            console.log(`🤖 Trying Google Model: ${modelName} `);
            const genAI = new GoogleGenerativeAI(currentKey);
            const model = genAI.getGenerativeModel({
              model: modelName,
              generationConfig: { responseMimeType: "application/json" }
            });

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            // Clean and Parse
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(text); // SUCCESS! Return result.

          } catch (error: any) {
            console.warn(`❌ Google ${modelName} failed with Key ${safeKeyLog}: ${error.message}`);
            lastError = `Google Error: ${error.message}`;

            // If Quota Error (429) or Forbidden (403), switch key
            if (error.message.includes('429') || error.message.includes('Quota') || error.message.includes('403')) {
              console.warn(`⚠️ Key ${safeKeyLog} Exhausted. Switching to next key...`);
              break; // Exit model loop -> Next Key
            }
          }
        }
      }
    }
  } else {
    console.log("ℹ️ No Google API Keys found. Skipping to Groq...");
  }

  // --- PHASE 2: TRY GROQ (Fallback/Alternative) ---
  if (groqKey) {
    console.log("🚀 Switching to Groq (Llama 3.3) Fallback...");
    try {
      const groq = new Groq({ apiKey: groqKey });
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "You are a JSON-only API. You must return ONLY a valid JSON object. Do not include markdown code blocks. Escape all double quotes inside strings." },
          { role: "user", content: prompt }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        // response_format: { type: "json_object" } // <--- DISABLED due to strict 400 errors
      });

      const content = completion.choices[0]?.message?.content || "{}";
      return safeJsonParse(content, productName, language); // Use robust parser with locale

    } catch (groqError: any) {
      console.error("❌ Groq Failed:", groqError);
      lastError += ` | Groq Error: ${groqError.message}`;
    }
  } else {
    console.log("ℹ️ No Groq API Key found.");
  }

  // --- PHASE 3: TOTAL FAILURE ---
  return { error: `ALL AI Models Failed. Last text received might be malformed. Details: ${lastError}` };
}

// HELPER: ROBUST PARSER (The "Tank")
// HELPER: ROBUST PARSER (The "Tank")
function safeJsonParse(text: string, fallbackName: string, language: 'en' | 'es' = 'en'): any {
  const isEs = language === 'es';
  try {
    // 1. Try clean parse
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(clean.substring(firstBrace, lastBrace + 1));
    }
    throw new Error("No JSON braces");
  } catch (e) {
    console.warn("⚠️ JSON Parse failed. Engaging Emergency Regex Extraction...");
    // 2. Emergency Regex Extraction (The "Jaws of Life")
    // Use [\s\S]*? for non-greedy multiline matching
    const extract = (key: string) => {
      // Try standard JSON format "key": "value"
      const match = text.match(new RegExp(`"${key}"\\s*:\\s*"([\\s\\S]*?)"`));
      return match ? match[1] : "";
    };

    const title = extract("title") || extract("optimizedTitle") || `${fallbackName} Review`;
    const intro = extract("introduction") || extract("heroDescription") || (isEs ? "Contenido generado." : "Content generated.");

    // NEW: Robust Body Recovery
    let bodyContent = extract("articleBody") || extract("features") || "";
    // If extraction failed but text exists, it might be raw markdown without JSON keys
    if (!bodyContent && text.includes("##")) {
      // Assume the whole text after the first big header is content
      const headerIndex = text.indexOf("##");
      if (headerIndex !== -1) bodyContent = text.substring(headerIndex);
    }
    if (!bodyContent) bodyContent = isEs ? "Error al generar contenido detallado." : "Error generating detailed content.";

    const keyTakeaways = extract("keyTakeaways");

    // Localized Fallbacks
    const fallbackPros = isEs
      ? ["Alto Rendimiento", "Diseño Premium", "Funciones Avanzadas", "Fiabilidad Total"]
      : ["High Performance", "Great Design", "Advanced Features", "Reliable"];
    const fallbackCons = isEs
      ? ["Precio Premium", "Curva de Aprendizaje"]
      : ["Premium Price", "Learning Curve"];
    const fallbackVerdict = isEs
      ? "En conclusión, este producto es una opción sólida. La IA generó este resumen básico."
      : "In conclusion, this product is a solid choice. AI generated this basic summary.";

    // Construct a safe fallback object
    return {
      title: title,
      introduction: intro,
      targetAudience: extract("targetAudience") || (isEs ? "Público General" : "General Audience"),
      keyTakeaways: keyTakeaways, // Now we rescue the card!
      quantitativeAnalysis: "8.5/10",
      pros: fallbackPros,
      cons: fallbackCons,
      features: bodyContent, // Map articleBody to features for Frontend compatibility
      verdict: extract("verdict") || fallbackVerdict,
      comparisonTable: []
    };
  }
}

export async function generateBattleContent(productA: any, productB: any, apiKey: string, language: 'en' | 'es') {
  // Check for Groq FIRST
  let finalApiKey = apiKey;
  let provider = 'google';

  if (apiKey?.startsWith('gsk_') || process.env.GROQ_API_KEY) {
    finalApiKey = apiKey?.startsWith('gsk_') ? apiKey : process.env.GROQ_API_KEY!;
    provider = 'groq';
  } else {
    finalApiKey = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  }

  if (!finalApiKey) return { error: "API Key Missing" };

  const genAI = new GoogleGenerativeAI(finalApiKey);
  // Dynamic Model Selection
  const modelName = await getBestActiveModel(finalApiKey);
  console.log(`Battle using model: ${modelName}`);
  const model = genAI.getGenerativeModel({ model: modelName });

  const langName = language === 'es' ? 'Spanish' : 'English';

  const prompt = `
    Act as a Tech Reviewer Judge. We are doing a "Versus" Battle.
    Product A: ${productA.productName} (${productA.description})
    Product B: ${productB.productName} (${productB.description})
    Language: ${langName}
    
    Task: Write a comprehensive comparison article.
    Return JSON:
    {
        "title": "Clickbait Title (e.g. 'A vs B: The Honest Truth')",
        "introduction": "Hook the reader. Establish rivalry.",
        "targetAudience": "Who buys A vs B?",
        "quantitativeAnalysis": "Score A vs B.",
        "pros": ["A Pros..."],
        "cons": ["B Cons..."],
        "features": "Key differences.",
        "comparisonTable": [
             { "name": "${productA.productName}", "price": "Check Price", "rating": 9, "mainFeature": "X" },
             { "name": "${productB.productName}", "price": "Check Price", "rating": 8, "mainFeature": "Y" }
        ],
        "verdict": "Clear winner.",
        "internalLinks": []
    }
    Return ONLY valid JSON.
  `;

  try {
    let text = "";

    // GROQ SUPPORT
    if (finalApiKey.startsWith("gsk_")) {
      const groq = new Groq({ apiKey: finalApiKey });
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" }
      });
      text = completion.choices[0]?.message?.content || "{}";
    } else {
      // GEMINI FALLBACK
      const genAI = new GoogleGenerativeAI(finalApiKey);
      const modelName = await getBestActiveModel(finalApiKey);
      console.log(`Battle using model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      text = response.text();
    }

    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (e: any) {
    console.error("Battle AI Error:", e);
    return { error: e.message };
  }
}

// === DB Actions ===

export async function createCampaign(inputPayload: any) {
  // FORCE REDEPLOY: Normalize input (FormData vs JSON)

  // 1. Normalize Input
  let data = inputPayload;
  if (inputPayload instanceof FormData) {
    data = Object.fromEntries(inputPayload);
  }

  console.log("📦 CREATE CAMPAIGN RECEIVED:", JSON.stringify(data, null, 2));

  try {
    // 2. Validate Essential Data
    if (!data.productName && !data.title) {
      return { error: "Validation Error: Product Name is required." };
    }

    // === AUTO-IMAGE FETCHING START ===
    let galleryImages: string[] = [];
    let mainImage = data.imageUrl;
    let skipAutoFetch = false;

    // 1. MANUAL OVERRIDE: Did user provide manual gallery URLs?
    if (data.manualGallery && typeof data.manualGallery === 'string' && data.manualGallery.trim().length > 0) {
      console.log("🖼️ Using Manual Gallery Images provided by user.");
      galleryImages = data.manualGallery
        .split(/[\n,]+/) // Split by newline or comma
        .map((url: string) => url.trim())
        .filter((url: string) => url.startsWith('http')) // Basic validation
        .slice(0, 4);

      if (galleryImages.length > 0) {
        skipAutoFetch = true;
        // If no main image provided, use the first manual one
        if (!mainImage) mainImage = galleryImages[0];
      }
    }

    try {
      if (!skipAutoFetch) {
        // If the user didn't provide a real image (or empty/placeholder)
        if (!mainImage || mainImage.includes('placehold.co') || mainImage.trim() === "") {
          console.log(`Auto-fetching images for: ${data.productName}`);
          const foundImages = await searchProductImages(data.productName + " product", 4);
          if (foundImages.length > 0) {
            mainImage = foundImages[0];
            galleryImages = foundImages;
          }
        } else {
          // User provided an image, try to fetch 3 more variants to fill gallery
          console.log(`Fetching extra gallery images for: ${data.productName}`);

          // Strategy: High-Volume Search to ensure visual diversity
          // 1. Get Base Images (Request 8 to have a good pool of candidates)
          console.log("📸 Fetching Primary Image Batch...");
          let additionalImages = await searchProductImages(data.productName, 8);

          // Ensure unique images from the start
          const uniqueSet = new Set<string>();
          if (mainImage) uniqueSet.add(mainImage);

          additionalImages.forEach(img => {
            if (img && !uniqueSet.has(img)) uniqueSet.add(img);
          });

          // 2. If we don't have enough unique images, try "Lifestyle/Context" query
          if (uniqueSet.size < 5) { // We want main + 4 others ideally
            console.log("📸 Not enough variety. Fetching Lifestyle Batch...");
            const lifestyleImages = await searchProductImages(data.productName + " lifestyle review real", 6);
            lifestyleImages.forEach(img => {
              if (img && !uniqueSet.has(img)) uniqueSet.add(img);
            });
          }

          // 3. Last resort: "Unboxing/Packaging" for different angles
          if (uniqueSet.size < 5) {
            console.log("📸 Still low. Fetching Detail Batch...");
            const detailImages = await searchProductImages(data.productName + " unboxing detail", 4);
            detailImages.forEach(img => {
              if (img && !uniqueSet.has(img)) uniqueSet.add(img);
            });
          }

          // Convert set to array and take top 4 EXCLUDING mainImage (since mainImage is handled separately in Gallery)
          // Actually, let's just pass them all and let Gallery Component sort it, 
          // but we need to pass a list of *extra* images to 'galleryImages'.
          const allUnique = Array.from(uniqueSet);
          galleryImages = allUnique.filter(img => img !== mainImage).slice(0, 4);
        }
      }
    } catch (imgError: any) {
      console.error("Auto-Image Fetch Failed (Non-blocking):", imgError);
      // DEBUG: Inject error into description so user can see it
      data.description = `[DEBUG ERROR: ${imgError.message || "Unknown error"}] ` + data.description;

      // Fallback: If no gallery, ensure at least main image is in gallery if it exists
      if (mainImage) {
        if (galleryImages.length === 0) galleryImages = [mainImage];

        // FORCE FILL: If we still don't have 4 images (common for future/fake products),
        // duplicate the main image with fake query params to ensure gallery UI looks full.
        let variantCounter = 1;
        while (galleryImages.length < 4) {
          const separator = mainImage.includes('?') ? '&' : '?';
          galleryImages.push(`${mainImage}${separator}variant=${variantCounter}`);
          variantCounter++;
        }
      }
    }

    // FINAL GLOBAL CHECK: Ensure we ALWAYS have 4 images for the UI
    // This runs whether the try block succeeded (but found < 4 images) or failed.
    if (mainImage && galleryImages.length < 4) {
      let variantCounter = 1;
      while (galleryImages.length < 4) {
        const separator = mainImage.includes('?') ? '&' : '?';
        const variantUrl = `${mainImage}${separator}variant=${variantCounter}`;
        // Avoid duplicates just in case
        if (!galleryImages.includes(variantUrl)) {
          galleryImages.push(variantUrl);
        }
        variantCounter++;
      }
    }

    // === AUTO-IMAGE FETCHING END ===
    console.log("🔍 DEBUG: Final Gallery Count:", galleryImages.length);

    // BACKUP STRATEGY: Prefer explicit 'content' object from client, fallback to manual extraction
    let contentData: any = {};

    if (data.content && typeof data.content === 'object' && !Array.isArray(data.content)) {
      contentData = { ...data.content };
    } else {
      contentData = {
        introduction: data.introduction,
        targetAudience: data.targetAudience,
        quantitativeAnalysis: data.quantitativeAnalysis,
        features: data.features,
        pros: data.pros,
        cons: data.cons,
        comparisonTable: data.comparisonTable,
        verdict: data.verdict,
        internalLinks: data.internalLinks
      };
    }

    // Always attach image backup
    contentData.galleryImagesBackup = galleryImages;

    let campaign;
    try {
      campaign = await prisma.campaign.create({
        data: {
          slug: data.slug || data.id,
          type: data.type,
          category: data.category || 'general',
          language: data.language || 'en',
          productName: data.productName,
          title: data.title || data.productName,
          description: data.heroDescription || data.description || data.introduction?.substring(0, 160) || "",
          affiliateLink: data.affiliateLink,
          imageUrl: mainImage,
          content: JSON.stringify(contentData),
          parentId: data.parentId && data.parentId.trim() !== "" ? data.parentId : null,
        }
      });
    } catch (e: any) {
      // HANDLE DUPLICATE SLUG (P2002)
      if (e.code === 'P2002') {
        console.warn("⚠️ Slug collision detected. Retrying with suffix...");
        const newSlug = `${data.id}-${Date.now().toString().slice(-4)}`;
        campaign = await prisma.campaign.create({
          data: {
            slug: newSlug,
            type: data.type,
            category: data.category || 'general',
            language: data.language || 'en',
            productName: data.productName,
            title: data.title || data.productName,
            description: data.heroDescription || data.description || data.introduction?.substring(0, 160) || "",
            affiliateLink: data.affiliateLink,
            imageUrl: mainImage,
            content: JSON.stringify(contentData),
            parentId: data.parentId && data.parentId.trim() !== "" ? data.parentId : null,
          }
        });
      } else {
        throw e; // Rethrow other errors
      }
    }
    // --- AUTO-INDEXING SIGNAL ---
    const baseUrl = 'https://gestor-afiliados-web.vercel.app';
    const finalUrl = `${baseUrl}/${campaign.category}/${campaign.slug}`;
    console.log(`🚀 Triggering Background Indexing for: ${finalUrl}`);
    requestIndexing(finalUrl).catch(err => console.error("⚠️ Background Indexing Error:", err));
    // -----------------------------

    // FORCE CACHE UPDATE
    import('next/cache').then(({ revalidatePath }) => {
      revalidatePath('/dashboard');
      revalidatePath('/');
      if (campaign.category) revalidatePath(`/categories/${campaign.category}`);
    });

    return { success: true, slug: campaign.slug, type: campaign.type };
  } catch (error: any) {
    console.error("DB Create Error:", error);
    return { error: `DB Error: ${error.message}` };
  }
}

export async function updateCampaign(slug: string, data: any) {
  try {
    // Process Manual Gallery Override for Updates
    let galleryImagesBackup = data.galleryImagesBackup; // Try to keep existing if passed

    if (data.manualGallery && data.manualGallery.trim().length > 0) {
      galleryImagesBackup = data.manualGallery
        .split(/[\n,]+/)
        .map((url: string) => url.trim())
        .filter((url: string) => url.startsWith('http'))
        .slice(0, 4);
    }

    const campaign = await prisma.campaign.update({
      where: { slug },
      data: {
        type: data.type, // <-- CRITICAL FIX: Allow changing types (e.g. converting to Hub)
        category: data.category || 'general',
        language: data.language || 'en',
        productName: data.productName,
        title: data.title || data.productName,
        description: data.heroDescription || data.description || data.introduction?.substring(0, 160) || "",
        affiliateLink: data.affiliateLink,
        imageUrl: data.imageUrl,
        content: JSON.stringify((() => {
          let contentToSave: any = {};
          if (data.content && typeof data.content === 'object' && !Array.isArray(data.content)) {
            contentToSave = { ...data.content };
          } else {
            contentToSave = {
              introduction: data.introduction,
              targetAudience: data.targetAudience,
              quantitativeAnalysis: data.quantitativeAnalysis,
              features: data.features,
              pros: data.pros,
              cons: data.cons,
              comparisonTable: data.comparisonTable,
              verdict: data.verdict,
            };
          }
          contentToSave.galleryImagesBackup = galleryImagesBackup;
          return contentToSave;
        })()),
      }
    });

    // --- AUTO-INDEXING SIGNAL (UPDATE) ---
    const baseUrl = 'https://gestor-afiliados-web.vercel.app';
    const finalUrl = `${baseUrl}/${campaign.category}/${campaign.slug}`;
    requestIndexing(finalUrl).catch(err => console.error("⚠️ Background Indexing Error (Update):", err));
    // -------------------------------------

    return { success: true, slug: campaign.slug, type: campaign.type };
  } catch (error: any) {
    console.error("DB Update Error:", error);
    return { error: "Failed to update campaign." };
  }
}

export async function getCampaign(slug: string) {
  return await prisma.campaign.findUnique({
    where: { slug },
    include: {
      parent: {
        select: { slug: true, title: true, category: true }
      },
      children: {
        select: { slug: true, title: true, type: true, description: true, imageUrl: true }
      }
    }
  });
}

// NEW: Fetch Hubs for Dropdown
export async function getAvailableHubs() {
  try {
    return await prisma.campaign.findMany({
      where: {
        // We consider Hubs anything that is not a standard 'review' or 'product'
        // Ideally we should use the new types 'hub_principal' | 'subhub'
        OR: [
          { type: 'hub_principal' },
          { type: 'subhub' },
          { type: 'landing' } // Fallback
        ]
      },
      select: { id: true, title: true, slug: true, type: true }
    });
  } catch (e) {
    return [];
  }
}

export async function getCampaignsByCategory(category: string, limit: number = 10) {
  try {
    return await prisma.campaign.findMany({
      where: { category },
      select: {
        slug: true,
        productName: true,
        title: true,
        description: true,
        imageUrl: true,
        category: true,
        type: true,
        content: true, // Fetch content to determine Pillar/Standard status via length
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  } catch (error) {
    return [];
  }
}

export async function getAllCampaigns() {
  try {
    return await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        productName: true,
        type: true,
        imageUrl: true,
        createdAt: true,
        category: true,
        affiliateLink: true,
        parentId: true,
        parent: {
          select: { title: true }
        }
      }
    });
  } catch (error) {
    return [];
  }
}

export async function deleteCampaign(slug: string) {
  try {
    // 1. First find the campaign to get its ID (safer than relation query for updateMany sometimes)
    const campaign = await prisma.campaign.findUnique({ where: { slug }, select: { id: true } });

    if (campaign) {
      // 2. Unlink any children (orphans) - Preventive Step
      await prisma.campaign.updateMany({
        where: { parentId: campaign.id },
        data: { parentId: null }
      });

      // 3. Now delete safely
      await prisma.campaign.delete({
        where: { slug }
      });

      // FORCE CACHE UPDATE
      import('next/cache').then(({ revalidatePath }) => {
        revalidatePath('/dashboard');
        revalidatePath('/');
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Delete Error:", error);
    return { error: error.message || "Failed to delete" };
  }
}

export async function duplicateCampaign(slug: string) {
  try {
    const original = await prisma.campaign.findUnique({ where: { slug } });
    if (!original) return { error: "Campaign not found" };

    let newSlug = `${slug}-copy`;
    let counter = 1;
    while (await prisma.campaign.findUnique({ where: { slug: newSlug } })) {
      newSlug = `${slug}-copy-${counter}`;
      counter++;
    }

    const duplicate = await prisma.campaign.create({
      data: {
        slug: newSlug,
        type: original.type,
        category: original.category,
        language: original.language,
        productName: `${original.productName} (Copy)`,
        title: original.title,
        description: original.description,
        affiliateLink: original.affiliateLink,
        imageUrl: original.imageUrl,
        content: original.content,
      }
    });

    return { success: true, slug: duplicate.slug };
  } catch (error) {
    return { error: "Failed to duplicate campaign" };
  }
}

import * as cheerio from 'cheerio';

export async function scrapeAmazonProduct(url: string) {
  if (!url.includes('amazon') && !url.includes('amzn')) {
    return { error: 'Not a valid Amazon URL' };
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. Title Extraction
    let title = $('#productTitle').text().trim();
    if (!title) {
      title = $('meta[name="title"]').attr('content') || $('title').text().split(':')[0] || "";
    }

    // 2. Image Extraction
    let image = "";
    // Try to find the dynamic image data JSON
    const scriptContent = html.match(/"large":"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+\.jpg)"/);
    if (scriptContent) {
      image = scriptContent[1];
    } else {
      image = $('#landingImage').attr('src') || $('#imgBlkFront').attr('src') || "";
    }

    // 3. Features (Bullet Points)
    let features: string[] = [];
    $('#feature-bullets li span.a-list-item').each((i, el) => {
      const text = $(el).text().trim();
      if (text) features.push(text);
    });

    // 4. Product Description
    let description = "";
    const cleanDesc = (text: string) => text.replace(/\s+/g, ' ').trim();

    // Amazon uses different containers
    const descEl = $('#productDescription p').add('#productDescription span').first();
    if (descEl.length) {
      description = cleanDesc(descEl.text());
    }

    // Backup description from meta
    if (!description || description.length < 50) {
      description = $('meta[name="description"]').attr('content') || "";
    }

    // 5. EXTRACT GALLERY IMAGES (AGGRESSIVE STRATEGY)
    let galleryUrls: string[] = [];

    // Strategy A: Look for "hiRes" or "large" keys (JSON blobs)
    const hiResMatches = [...html.matchAll(/"hiRes":"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+\.jpg)"/g)];
    const largeMatches = [...html.matchAll(/"large":"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+\.jpg)"/g)];

    // Strategy B: Look for data-a-dynamic-image attributes (Common in gallery <li>)
    // format: data-a-dynamic-image="{&quot;https://...&quot;:[x,y]}"
    const dynamicImgMatches = [...html.matchAll(/data-a-dynamic-image="([^"]+)"/g)];

    // Strategy C: Brute-force look for any Amazon content image URL 
    const genericMatches = [...html.matchAll(/(https:\/\/m\.media-amazon\.com\/images\/I\/[a-zA-Z0-9\-\._]+\.jpg)/g)];

    let allFound = [
      ...hiResMatches.map(m => m[1]),
      ...largeMatches.map(m => m[1]),
      ...genericMatches.map(m => m[1])
    ];

    // parse dynamic matches
    dynamicImgMatches.forEach(m => {
      try {
        const raw = m[1].replace(/&quot;/g, '"');
        const keys = Object.keys(JSON.parse(raw));
        allFound.push(...keys);
      } catch (e) { }
    });

    const uniqueGallery = Array.from(new Set(allFound));

    // Filter
    galleryUrls = uniqueGallery
      .filter(u =>
        u !== image &&
        !u.includes('sprite') &&
        !u.includes('placeholder') &&
        !u.includes('load') &&
        !u.includes('pixel')
      )
      // Heuristic: larger file names often mean better resolution/main images on Amazon
      .sort((a, b) => b.length - a.length)
      .slice(0, 8);

    // HYBRID FALLBACK: If Amazon scraper found few images (likely due to AJAX loading),
    // supplement with Google Images to ensure Variety.
    if (galleryUrls.length < 3) {
      console.log("⚠️ Scraper found few images. Supplementing with Google Search...");
      try {
        // Search for "Product Name + lifestyle/context"
        // TRUNCATE TITLE: Amazon titles are too long for Google Search query, usually killing results.
        // Take first 5 words only.
        const shortTitle = title.split(' ').slice(0, 5).join(' ');
        const query = `${shortTitle} lifestyle review`;

        const googleImages = await searchProductImages(query, 4);

        // Add unique Google images
        googleImages.forEach(gImg => {
          if (gImg !== image && !galleryUrls.includes(gImg)) {
            galleryUrls.push(gImg);
          }
        });
      } catch (e) {
        console.error("Google Fallback failed:", e);
      }
    }

    return {
      productName: title,
      imageUrl: image,
      features: features.slice(0, 15).join("\n- "),
      description: description.slice(0, 5000),
      manualGallery: galleryUrls.slice(0, 6).join('\n') // Limit to top 6 mixed
    };

  } catch (error) {
    console.error("Scrape Error:", error);
    return { error: "Could not auto-fetch. Please fill manually." };
  }
}

// Helper to find valid models dynamically
async function getBestActiveModel(apiKey: string) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

    if (!response.ok) return "gemini-1.5-flash"; // Auth error fallback

    const data = await response.json();

    if (!data.models) return "gemini-1.5-flash"; // Fallback default

    const models = data.models.map((m: any) => m.name.replace('models/', ''));

    // Priority list
    const preferred = [
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash-001",
      "gemini-1.5-flash-002",
      "gemini-1.5-pro",
      "gemini-pro"
    ];

    for (const p of preferred) {
      if (models.includes(p)) return p;
    }

    // If no exact match, try fuzzy match for 'flash' then 'pro'
    const flash = models.find((m: string) => m.includes("flash"));
    if (flash) return flash;

    const pro = models.find((m: string) => m.includes("pro"));
    if (pro) return pro;

    return "gemini-pro"; // Ultimate fallback
  } catch (e) {
    console.error("Model discovery failed", e);
    return "gemini-pro";
  }
}

export async function analyzeTrends(category: string, language: 'en' | 'es', apiKey: string) {
  /* 
     PRIORITY LOGIC:
     1. Form Input (apiKey)
     2. Env GROQ_API_KEY
     3. Env GOOGLE/GEMINI KEYS
  */

  // Check for Groq FIRST
  let finalApiKey = apiKey;
  let provider = 'google';

  if (apiKey?.startsWith('gsk_') || process.env.GROQ_API_KEY) {
    finalApiKey = apiKey?.startsWith('gsk_') ? apiKey : process.env.GROQ_API_KEY!;
    provider = 'groq';
  } else {
    finalApiKey = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  }

  if (!finalApiKey) return { error: "API Key Missing. Please add it in the campaign form or Vercel env vars." };

  const langPrompt = language === 'es' ? 'Spanish' : 'English';

  try {
    const prompt = `
      Act as a Market Analysis AI expert specializing in 2025/2026 consumer trends.
      For the category "${category}", identify 3 high-probability trending product niches that will sell well in late 2025/2026.
      Focus on looking forward - futuristic but available (or soon available) tech.
      Language: ${langPrompt}

      Return strict JSON:
      {
        "trends": [
          {
            "nicheTitle": "Niche Name",
            "reason": "Why hot now?",
            "suggestedProduct": "Product Keyword"
          }
        ]
      }
    `;

    let text = "";

    // GROQ SUPPORT
    if (finalApiKey.startsWith("gsk_")) {
      const groq = new Groq({ apiKey: finalApiKey });
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" }
      });
      text = completion.choices[0]?.message?.content || "{}";
    } else {
      // GEMINI FALLBACK
      const genAI = new GoogleGenerativeAI(finalApiKey);
      const modelName = await getBestActiveModel(finalApiKey);
      console.log(`Trends using model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      text = response.text();
    }

    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(text);

    // Google Trends Validation (Safe execution)
    if (data.trends && Array.isArray(data.trends)) {
      await Promise.all(data.trends.map(async (trend: any) => {
        try {
          const trendsRes = await googleTrends.interestOverTime({
            keyword: trend.suggestedProduct,
            startTime: new Date(Date.now() - (365 * 24 * 60 * 60 * 1000)),
          });
          const trendData = JSON.parse(trendsRes);

          if (trendData.default && trendData.default.timelineData && trendData.default.timelineData.length > 0) {
            const points = trendData.default.timelineData.map((d: any) => d.value[0]);
            const start = points.slice(0, 4).reduce((a: number, b: number) => a + b, 0) / 4;
            const end = points.slice(-4).reduce((a: number, b: number) => a + b, 0) / 4;

            let growth = 0;
            if (start === 0 && end > 0) growth = 100;
            else if (start > 0) growth = ((end - start) / start) * 100;

            trend.realData = {
              hasData: true,
              growthPercent: Math.round(growth),
              direction: growth > 5 ? 'up' : growth < -5 ? 'down' : 'flat'
            };
          } else {
            trend.realData = { hasData: false };
          }
        } catch (err) {
          trend.realData = { hasData: false, error: true };
        }
      }));
    }

    return data;

  } catch (e: any) {
    return { error: `AI Error (${e.message}). Try checking your API Key or Quota.` };
  }
}

// NEW: Efficient Data Fetching for Homepage
export async function getHomePageData() {
  try {
    const hubs = await prisma.campaign.findMany({
      where: {
        OR: [{ type: 'hub_principal' }, { type: 'subhub' }]
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
      select: { title: true, slug: true, category: true, imageUrl: true, description: true }
    });

    const latest = await prisma.campaign.findMany({
      // REMOVED FILTER: Show EVERYTHING including Hubs for now
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: { title: true, slug: true, category: true, imageUrl: true, type: true, createdAt: true, productName: true }
    });

    return { hubs, latest };
  } catch (e) {
    return { hubs: [], latest: [] };
  }
}
