"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

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

export async function generateSeoContent(productName: string, basicDescription: string, apiKey: string, type: 'landing' | 'blog' = 'landing', language: 'en' | 'es' = 'en', tone: string = 'Professional') {
  const finalApiKey = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!finalApiKey) {
    return { error: "API Key Missing. Please set NEXT_PUBLIC_GEMINI_API_KEY environment variable or provide it in the form." };
  }

  const genAI = new GoogleGenerativeAI(finalApiKey);

  const modelsToTry = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-1.5-flash"
  ];

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`Attempting to generate with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      let prompt = "";
      const langName = language === 'es' ? 'Spanish' : 'English';

      const SALES_STORYTELLING_FRAMEWORK = `
        ADVANCED SALES STORYTELLING & PSYCHOLOGY GUIDELINES (StoryBrand + Challenger Sale):

        1. THE HERO'S JOURNEY (Customer Centricity):
           - The Customer is the Hero, NOT the product. The product is the "Guide" or "Excalibur".
           - Start with the "External Problem" (e.g., messy house) but quickly pivot to the "Internal Problem" (e.g., feeling overwhelmed/failure).
           - The resolution must be "Success" (Transformation) vs "Failure" (Tragedy if they don't buy).

        2. CHALLENGER INSIGHT (Teach & Tailor):
           - Don't just list specs. "Teach" them something they didn't know about their problem.
           - Challenge their current way of doing things. "Why your current X is costing you money."

        3. EMOTIONAL ARC:
           - Use sensory words. Make them 'feel' the frustration of the problem and the relief of the solution.
           - Build tension before the reveal.

        4. SCARCITY & URGENCY (Cialdini’s Principles):
           - Subtly imply that high-quality solutions like this are rare or limited.

        5. SOCIAL PROOF INTEGRATION:
           - Weave in "micro-stories" of others who have succeeded (e.g., "Like Sarah, who finally...").
      `;

      if (type === 'blog') {
        prompt = `
                    Act as a Master Copywriter and Storyteller (following StoryBrand & Challenger Sale frameworks).
                    Your goal is to weave a narrative that compels the reader to buy by connecting emotionally.

                    Product: "${productName}"
                    Details: "${basicDescription}"
                    Tone: ${tone}
                    Language: ${langName}

                    ${SALES_STORYTELLING_FRAMEWORK}
                    (Also keep E-E-A-T principles in mind for authority, but prioritize engagement/story)

                    Generate a strict JSON response:
                    {
                        "title": "A Story-Driven Hook Title (e.g., 'I Tried X So You Don't Have To' or 'The End of [Problem]?') in ${langName}",
                        "introduction": "A 3-paragraph narrative hook. Start with a specific, relatable struggle scene (The Villain). Introduce the product as the Guide. Hint at the result.",
                        "targetAudience": "Define the 'Hero' of this story. (e.g., 'For the parent who is tired of...')",
                        "quantitativeAnalysis": "Performance Score based on the 'Promise' vs 'Reality' (Story gap).",
                        "pros": ["Transformational Benefit 1", "Transformational Benefit 2", "Feature that solves specific pain"],
                        "cons": ["Minor flaw that adds authenticity (Perfect is fake)", "Limitation for specific non-target users"],
                        "features": "Describe features as 'Superpowers' the hero gains. (Not '100W motor', but 'The power to clean in half the time').",
                        "comparisonTable": [
                            { "name": "${productName}", "price": "$$$", "rating": 9.8, "mainFeature": "The Ultimate Solution" },
                            { "name": "Old Way / Competitor", "price": "$$", "rating": 6.5, "mainFeature": "The Struggle" },
                            { "name": "Premium High-End", "price": "$$$$", "rating": 8.5, "mainFeature": "Overpriced" }
                        ],
                        "verdict": "The Climax. Reiterate the transformation. 'If you want to go from [Sad State] to [Happy State], this is your tool.'"
                    }
                    Return ONLY valid JSON.
                `;
      } else {
        prompt = `
                    Act as a Direct Response Copywriter using StoryBrand principles.
                    Product: "${productName}"
                    Details: "${basicDescription}"
                    Tone: ${tone}
                    Language: ${langName}

                    ${SALES_STORYTELLING_FRAMEWORK}

                    Generate JSON:
                    {
                        "optimizedTitle": "Story-Driven Meta Title (Promise of Transformation) in ${langName} (max 60 chars)",
                        "optimizedDescription": "Meta Description that opens a 'Story Loop' in the reader's mind. (max 155 chars) in ${langName}"
                    }
                    Return ONLY valid JSON.
                `;
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log(`Success with ${modelName}. Response:`, text.substring(0, 100) + "...");

      let cleanedText = text.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/^```json/, "").replace(/```$/, "");
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```/, "").replace(/```$/, "");
      }

      return JSON.parse(cleanedText);

    } catch (error: any) {
      console.error(`Failed with model ${modelName}:`, error.message);
      lastError = error;
    }
  }

  return { error: `All models failed. Last specific error: ${lastError?.message || "Unknown error"}` };
}

// === NEW: DB Actions ===

export async function createCampaign(data: any) {
  try {
    const campaign = await prisma.campaign.create({
      data: {
        slug: data.id,
        type: data.type,
        category: data.category || 'general',
        productName: data.productName,
        title: data.title || data.productName,
        description: data.description || data.introduction || "",
        affiliateLink: data.affiliateLink,
        imageUrl: data.imageUrl,
        content: JSON.stringify({
          introduction: data.introduction,
          targetAudience: data.targetAudience, // New SEO field
          quantitativeAnalysis: data.quantitativeAnalysis, // New SEO field
          features: data.features,
          pros: data.pros,
          cons: data.cons,
          comparisonTable: data.comparisonTable,
          verdict: data.verdict
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
          verdict: data.verdict
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
        createdAt: true
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

    // Generate unique slug
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
    console.error("Duplicate Error:", error);
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
    // Simple parser (regex for speed/robustness against bad HTML)
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    let title = titleMatch ? titleMatch[1].replace(' : Amazon.es: Hogar y cocina', '').replace(' : Amazon.com', '').split(':')[0].trim() : "";

    // Try to find image
    const imgMatch = html.match(/"large":"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+\.jpg)"/);
    let image = imgMatch ? imgMatch[1] : "";

    if (!title) {
      // Fallback: extract from URL slug
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
