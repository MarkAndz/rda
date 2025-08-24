import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// This middleware runs on every request and protects routes based on our auth config
export async function middleware(request: NextRequest) {
  // Instead of using auth() directly, we use getToken() which works in Edge
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If the user is not authenticated and trying to access protected routes
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/profile') ||
    request.nextUrl.pathname.startsWith('/checkout') ||
    request.nextUrl.pathname.includes('/edit') ||
    request.nextUrl.pathname.includes('/create');

  if (isProtectedRoute && !token) {
    // Store the original URL to redirect back after login
    const redirectUrl = new URL('/auth/signin', request.url);
    redirectUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);

    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/checkout',
    '/restaurant/create',
    '/restaurant/:path*/edit',
    '/item/create',
    '/item/:path*/edit',
  ],
};
