"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
// @ts-ignore
import googleTrends from 'google-trends-api';

export async function debugAiConnection(apiKey: string) {
  if (!apiKey) return { error: "No API Key" };

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
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
  const finalApiKey = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!finalApiKey) return { error: "API Key Missing" };

  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error("Failed to fetch image");
    const arrayBuffer = await imgRes.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = imgRes.headers.get("content-type") || "image/jpeg";

    const genAI = new GoogleGenerativeAI(finalApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    console.error("Vision AI Error:", e);
    return { error: "Could not analyze image. Make sure the URL is publicly accessible." };
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
  const finalApiKey = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!finalApiKey) {
    return { error: "API Key Missing. Please set NEXT_PUBLIC_GEMINI_API_KEY environment variable or provide it in the form." };
  }

  const genAI = new GoogleGenerativeAI(finalApiKey);

  try {
    // Dynamic Model Selection
    const modelName = await getBestActiveModel(finalApiKey);
    console.log(`SEO Gen using model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });

    let prompt = "";
    const langName = language === 'es' ? 'Spanish' : 'English';

    const SALES_STORYTELLING_FRAMEWORK = `
      ADVANCED SALES STORYTELLING & PSYCHOLOGY GUIDELINES (StoryBrand + Challenger Sale):
      1. THE HERO'S JOURNEY: The Customer is the Hero. Product is the Guide.
      2. CHALLENGER INSIGHT: Teach them something new about their problem.
      3. EMOTIONAL ARC: Use sensory words.
      4. SCARCITY: Imply rarity.
      5. SOCIAL PROOF: Weave in stories.
    `;

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
              "introduction": "3-paragraph narrative hook.",
              "targetAudience": "Who is the Hero?",
              "quantitativeAnalysis": "Performance Score/Gap.",
              "pros": ["Benefit 1", "Benefit 2"],
              "cons": ["Authentic Flaw 1"],
              "features": "Superpower features.",
              "comparisonTable": [
                  { "name": "${productName}", "price": "$$$", "rating": 9.8, "mainFeature": "Solution" },
                  { "name": "Competitor", "price": "$$", "rating": 6.5, "mainFeature": "Problem" }
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);

  } catch (error: any) {
    console.error(`Failed generation:`, error.message);
    return { error: `AI Generation Failed: ${error.message || "Unknown error"}` };
  }
}

export async function generateBattleContent(productA: any, productB: any, apiKey: string, language: 'en' | 'es') {
  const finalApiKey = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
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
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (e: any) {
    console.error("Battle AI Error:", e);
    return { error: e.message };
  }
}

// === DB Actions ===

export async function createCampaign(data: any) {
  try {
    const campaign = await prisma.campaign.create({
      data: {
        slug: data.id,
        type: data.type,
        category: data.category || 'general',
        language: data.language || 'en',
        productName: data.productName,
        title: data.title || data.productName,
        description: data.description || data.introduction || "",
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
          internalLinks: data.internalLinks
        }),
      }
    });
    return { success: true, slug: campaign.slug, type: campaign.type };
  } catch (error: any) {
    console.error("DB Create Error:", error);
    return { error: "Failed to save campaign. Slug might be duplicate." };
  }
}

export async function updateCampaign(slug: string, data: any) {
  try {
    const campaign = await prisma.campaign.update({
      where: { slug },
      data: {
        category: data.category || 'general',
        language: data.language || 'en',
        productName: data.productName,
        title: data.title || data.productName,
        description: data.description || data.introduction || "",
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
          internalLinks: data.internalLinks
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

export async function scrapeAmazonProduct(url: string) {
  if (!url.includes('amazon') && !url.includes('amzn')) {
    return { error: 'Not a valid Amazon URL' };
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      }
    });

    const html = await response.text();
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    let title = titleMatch ? titleMatch[1].replace(' : Amazon.es: Hogar y cocina', '').replace(' : Amazon.com', '').split(':')[0].trim() : "";
    const imgMatch = html.match(/"large":"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+\.jpg)"/);
    const image = imgMatch ? imgMatch[1] : "";

    // VERCEL FIX: Do NOT save to local disk. Use remote URL.
    // In a future update, integrate Vercel Blob or AWS S3 here.

    if (!title) {
      const parts = url.split('/');
      const dpIndex = parts.indexOf('dp');
      if (dpIndex > 0) {
        title = parts[dpIndex - 1].replace(/-/g, ' ');
      }
    }

    return { title, image };
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
  const finalApiKey = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!finalApiKey) return { error: "API Key Missing. Please add it in the campaign form first." };

  const genAI = new GoogleGenerativeAI(finalApiKey);
  const langPrompt = language === 'es' ? 'Spanish' : 'English';

  try {
    // Dynamic Model Selection
    const modelName = await getBestActiveModel(finalApiKey);
    console.log(`Trends using model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
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
