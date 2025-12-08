import { NextRequest, NextResponse } from "next/server";
import { searchProductImages } from "@/lib/google-search";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || 'Lotus Smartwatch';

    // Check Env Vars
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;

    let envStatus = "✅ Configured";
    if (!apiKey) envStatus = "❌ Missing API KEY";
    if (!cx) envStatus = "❌ Missing CX ID";

    try {
        console.log(`🔍 DEBUG ROUTE: Searching for '${query}'`);
        const images = await searchProductImages(query, 4);

        return NextResponse.json({
            status: "OK",
            envStatus,
            query,
            found: images.length,
            images,
            instructions: "API IS WORKING PERFECTLY! ✅ If campaigns fail, check database/prisma."
        });

    } catch (error: any) {
        return NextResponse.json({
            status: "ERROR",
            envStatus,
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
