"use server";
// Force Vercel Deploy - Updated Groq Model 3.3
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
// @ts-ignore
import googleTrends from 'google-trends-api';
import Groq from "groq-sdk";
import { searchProductImages } from "@/lib/google-search";

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

export async function generateSeoContent(
  productName: string,
  basicDescription: string,
  apiKey: string,
  type: 'landing' | 'blog' = 'landing',
  language: 'en' | 'es' = 'en',
  tone: string = 'Professional',
  existingCampaigns: any[] = []
) {
  // FORCE GOOGLE KEY SELECTION
  // Buscamos la clave en todas las variables posibles
  let finalApiKey =
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    apiKey;

  // If the user manually provided a Groq key (starts with gsk_), ignore it and try to find a system Google key
  if (finalApiKey?.startsWith('gsk_')) {
    finalApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  }

  if (!finalApiKey) {
    return { error: "API Key Missing. Please set NEXT_PUBLIC_GEMINI_API_KEY environment variable or provide it in the form." };
  }

  const langName = language === 'es' ? 'Spanish' : 'English';
  const campaignsContext = existingCampaigns.length > 0
    ? `
    CONTEXT - EXISTING CONTENT ON SITE (For Internal Linking):
    Here is a list of other articles purely for reference context.
    ${JSON.stringify(existingCampaigns.map(c => ({ title: c.productName, category: c.category, slug: c.slug })))}
    
    MANDATORY SEO INSTRUCTION:
    If any of the above existing articles are HIGHLY relevant to this new product (same category or complementary), 
    you MUST strictly include them in an "internalLinks" array in the JSON response.
    Each link object must have: { "slug": "slug-here", "category": "category-here", "anchorText": "text-here" }.
    Auto-connect the dots for the user.
    `
    : "";

  const SALES_STORYTELLING_FRAMEWORK = `
    ADVANCED SALES STORYTELLING & PSYCHOLOGY GUIDELINES (StoryBrand + Challenger Sale):
    1. THE HERO'S JOURNEY: The Customer is the Hero. Product is the Guide.
    2. CHALLENGER INSIGHT: Teach them something new about their problem.
    3. EMOTIONAL ARC: Use sensory words.
    4. SCARCITY: Imply rarity.
    5. SOCIAL PROOF: Weave in stories.
  `;

  let prompt = "";
  if (type === 'blog') {
    prompt = `
        Act as a Master Copywriter.
        Product: "${productName}"
        Details: "${basicDescription}"
        Tone: ${tone}
        Language: ${langName}

        ${campaignsContext}
        ${SALES_STORYTELLING_FRAMEWORK}

        Generate strict JSON:
        {
            "title": "Story-Driven Hook Title",
            "heroDescription": "Short, punchy summary for the top hero section (max 2 sentences). MUST BE DIFFERENT from introduction.",
            "introduction": "3-paragraph narrative hook for the main content body.",
            "targetAudience": "Who is the Hero?",
            "quantitativeAnalysis": "Performance Score/Gap.",
            "pros": ["Benefit 1", "Benefit 2", "Benefit 3", "Benefit 4"],
            "cons": ["Authentic Flaw 1", "Authentic Flaw 2"],
            "features": "Superpower features based on real specs.",
            "comparisonTable": [
                { "name": "${productName}", "price": "€€€", "rating": 9.5, "mainFeature": "Solution" },
                { "name": "Competitor", "price": "€€", "rating": 6.8, "mainFeature": "Problem" }
            ],
            "internalLinks": [
               { "slug": "slug-of-post", "category": "category-of-post", "anchorText": "Link Text" }
            ],
            "verdict": "Final transformation promise."
        }
        Return ONLY valid JSON.
    `;
  } else {
    prompt = `
        Act as a Direct Response Copywriter.
        Product: "${productName}"
        Details: "${basicDescription}"
        Tone: ${tone}
        Language: ${langName}
        ${campaignsContext}
        ${SALES_STORYTELLING_FRAMEWORK}

        Generate JSON:
        {
            "optimizedTitle": "Story-Driven Meta Title (max 60 chars)",
            "optimizedDescription": "Meta Description (max 155 chars)"
        }
        Return ONLY valid JSON.
    `;
  }

  // LIST OF MODELS TO TRY (In order of priority)
  const modelsToTry = [
    "gemini-2.0-flash-lite-preview-02-05", // 1. Lite (Efficient)
    "gemini-2.0-flash",                    // 2. Standard 2.0
    "gemini-2.0-pro-exp-02-05",            // 3. Pro Experimental (Separate quota)
    "gemini-2.5-flash",                    // 4. Cutting Edge
    "gemini-1.5-flash"                     // 5. STABLE BACKUP
  ];

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`Trying SEO Gen with model: ${modelName}`);
      const genAI = new GoogleGenerativeAI(finalApiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text); // If success, return immediately

    } catch (error: any) {
      console.warn(`Model ${modelName} failed: ${error.message}`);
      lastError = error;
      continue; // Try next model
    }
  }

  return { error: `AI Generation Failed on all models. Last error: ${lastError?.message || "Unknown"}` };
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

export async function createCampaign(data: any) {
  // FORCE REDEPLOY: Syntax checked, manual gallery logic active
  try {
    // === AUTO-IMAGE FETCHING START ===
    let galleryImages: string[] = [];
    let mainImage = data.imageUrl;
    let skipAutoFetch = false;

    // 1. MANUAL OVERRIDE: Did user provide manual gallery URLs?
    if (data.manualGallery && data.manualGallery.trim().length > 0) {
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

    // BACKUP STRATEGY: Save images in content JSON too
    const contentData = {
      introduction: data.introduction,
      targetAudience: data.targetAudience,
      quantitativeAnalysis: data.quantitativeAnalysis,
      features: data.features,
      pros: data.pros,
      cons: data.cons,
      comparisonTable: data.comparisonTable,
      verdict: data.verdict,
      internalLinks: data.internalLinks,
      galleryImagesBackup: galleryImages // <--- Backup here
    };

    const campaign = await prisma.campaign.create({
      data: {
        slug: data.id,
        type: data.type,
        category: data.category || 'general',
        language: data.language || 'en',
        productName: data.productName,
        title: data.title || data.productName,
        description: data.heroDescription || data.description || data.introduction?.substring(0, 160) || "",
        affiliateLink: data.affiliateLink,
        imageUrl: mainImage,
        // galleryImages: galleryImages, // <--- COMENTADO para evitar error si la columna no existe en Prod
        content: JSON.stringify(contentData),
      }
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
        category: data.category || 'general',
        language: data.language || 'en',
        productName: data.productName,
        title: data.title || data.productName,
        description: data.heroDescription || data.description || data.introduction?.substring(0, 160) || "",
        affiliateLink: data.affiliateLink,
        imageUrl: data.imageUrl,
        content: JSON.stringify({
          introduction: data.introduction,
          targetAudience: data.targetAudience,
          quantitativeAnalysis: data.quantitativeAnalysis,
          features: data.features,
          pros: data.pros,
          cons: data.cons,
          comparisonTable: data.comparisonTable,
          verdict: data.verdict,
          galleryImagesBackup: galleryImagesBackup // <--- SAVE IT
        }),
      }
    });
    return { success: true, slug: campaign.slug, type: campaign.type };
  } catch (error: any) {
    console.error("DB Update Error:", error);
    return { error: "Failed to update campaign." };
  }
}

export async function getCampaign(slug: string) {
  return await prisma.campaign.findUnique({
    where: { slug }
  });
}

export async function getCampaignsByCategory(category: string, limit: number = 10) {
  try {
    return await prisma.campaign.findMany({
      where: { category },
      select: {
        slug: true,
        productName: true,
        imageUrl: true,
        category: true,
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
        affiliateLink: true
      }
    });
  } catch (error) {
    return [];
  }
}

export async function deleteCampaign(slug: string) {
  try {
    await prisma.campaign.delete({
      where: { slug }
    });
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete" };
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

    return {
      title,
      image,
      features: features.slice(0, 6).join("\n- "), // Return as bullet list string
      description: description.slice(0, 1000) // Limit length
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
