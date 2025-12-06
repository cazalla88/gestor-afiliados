import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
    matcher: ['/dashboard/:path*'],
};

export function middleware(req: NextRequest) {
    // If we are in development, maybe skip? optional. 
    // But let's keep it secure everywhere or check process.env.NODE_ENV

    const basicAuth = req.headers.get('authorization');
    const url = req.nextUrl;

    // Set your desired username/password in environment variables
    // Default fallback for safety if not set
    const user = process.env.ADMIN_USER || 'admin';
    const pwd = process.env.ADMIN_PASSWORD;

    if (!pwd) {
        // If no password set in env, allow access but warn on console (server side)
        // or block. Let's block to be safe.
        console.error("ADMIN_PASSWORD not set in environment variables.");
        // For now, if not set, we might not want to lock the user out locally completely
        // unless they know to set it. 
        // Let's assume the user will set it.
    }

    if (basicAuth) {
        const authValue = basicAuth.split(' ')[1];
        const [u, p] = atob(authValue).split(':');

        if (u === user && p === pwd) {
            return NextResponse.next();
        }
    }

    url.pathname = '/api/auth';

    return new NextResponse('Auth Required', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="Secure Dashboard"',
        },
    });
}
