export async function searchProductImages(query: string, count: number = 4): Promise<string[]> {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;

    if (!apiKey || !cx) {
        console.error("❌ Google API Error: Missing Keys");
        throw new Error("Missing Google API Configuration (Server Side)");
    }

    try {
        const url = new URL("https://www.googleapis.com/customsearch/v1");
        url.searchParams.append("key", apiKey);
        url.searchParams.append("cx", cx);
        url.searchParams.append("q", query);
        url.searchParams.append("searchType", "image");
        url.searchParams.append("num", count.toString());
        url.searchParams.append("imgSize", "large");
        url.searchParams.append("safe", "active");

        console.log(`🔍 Executing Google Search: ${query}`);

        const res = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            cache: 'no-store' // Don't cache failed results
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`❌ Google API Error (${res.status}): ${errorText}`);
            throw new Error(`Google API returned ${res.status}: ${errorText}`);
        }

        const data = await res.json();

        if (data.items && Array.isArray(data.items)) {
            const images = data.items.map((item: any) => item.link);
            console.log(`✅ Google Search Success: Found ${images.length} images`);
            return images;
        }

        console.warn("⚠️ Google Search returned OK but no 'items' found.");
        return [];

    } catch (error: any) {
        console.error("❌ Google Search Exception:", error.message);
        throw error; // Re-throw so actions.ts knows it failed
    }
}
