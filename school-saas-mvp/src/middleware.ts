import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, AuthTokenPayload } from '@/lib/auth'; // Use your actual path

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define paths that require authentication
  // For example, all routes under /api/secure/
  if (pathname.startsWith('/api/secure/')) {
    const authorizationHeader = request.headers.get('Authorization');
    let token: string | undefined;

    if (authorizationHeader && authorizationHeader.toLowerCase().startsWith('bearer ')) {
      token = authorizationHeader.substring(7); // Remove "Bearer " prefix
    }

    if (!token) {
      return NextResponse.json({ message: 'Authentication token missing' }, { status: 401 });
    }

    const decodedPayload = verifyToken(token); // Your JWT verification function

    if (!decodedPayload) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
    }

    // Optionally, attach user payload to the request for use in API handlers
    // This is more complex with Next.js middleware as direct request modification is limited.
    // Instead, API routes might re-verify or rely on the middleware having run.
    // For now, just ensuring the token is valid is the main goal.

    // Add user info to headers so API routes can access it
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decodedPayload.userId);
    requestHeaders.set('x-user-role', decodedPayload.role);
    if(decodedPayload.schoolId) requestHeaders.set('x-school-id', decodedPayload.schoolId);
    requestHeaders.set('x-user-name', decodedPayload.name);


    return NextResponse.next({
        request: {
            headers: requestHeaders,
        }
    });
  }

  // Allow other requests to pass through
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (the root path, if you want it unprotected)
     * - /login
     * - /register
     * - /api/auth/login
     * - /api/auth/register
     * (Adjust as needed)
     */
    '/api/secure/:path*', // Protects all routes under /api/secure/
    // Add other paths that need protection but are not API routes if necessary
    // e.g., '/dashboard/:path*' if not handled by client-side HOC
  ],
};
