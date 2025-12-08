import axios from 'axios';

const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_SEARCH_CX;

export async function searchProductImages(query: string, count: number = 4): Promise<string[]> {
    if (!GOOGLE_API_KEY || !GOOGLE_CX) {
        console.warn("Google Search API keys not configured.");
        return [];
    }

    try {
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: {
                key: GOOGLE_API_KEY,
                cx: GOOGLE_CX,
                q: query,
                searchType: 'image',
                num: count, // Max 10
                imgSize: 'large', // Get good quality images
                fileType: 'jpg,png,webp',
                safe: 'active'
            }
        });

        if (response.data.items) {
            return response.data.items.map((item: any) => item.link);
        }

        return [];
    } catch (error) {
        console.error("Error searching Google Images:", error);
        return [];
    }
}
