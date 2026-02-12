import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // The matcher already excludes /api, so this middleware 
    // should not normally be called for API routes.
    // However, if it were, we ensure it doesn't redirect.

    if (request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    // Logic for protecting dashboard routes
    const token = request.cookies.get('token')?.value; // In a real app, check cookies or headers

    // For this MVP, we mainly care about the matcher excluding /api
    // to prevent any accidental HTML redirects for API calls.

    return NextResponse.next();
}

// Ensure the middleware NEVER intercepts /api routes
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
