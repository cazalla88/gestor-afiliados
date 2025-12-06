import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
    // matcher: ['/dashboard/:path*'], // Disabled temporarily
    matcher: [],
};

export function middleware(req: NextRequest) {
    return NextResponse.next();
}
