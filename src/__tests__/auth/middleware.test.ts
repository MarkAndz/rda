import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

// Mock next-auth/jwt functions
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

// Mock NextResponse methods
vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn(() => ({ type: 'next' })),
    redirect: vi.fn((url: URL) => ({ type: 'redirect', url })),
  },
}));

describe('Auth Middleware', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();

    // Create mock request object
    mockRequest = {
      nextUrl: {
        pathname: '/',
        searchParams: new URLSearchParams(),
        clone: vi.fn().mockReturnThis(),
      },
      url: 'http://localhost:3000',
    } as unknown as NextRequest;

    // Reset NextResponse mock call history
    const NR = NextResponse as unknown as {
      next: ReturnType<typeof vi.fn>;
      redirect: ReturnType<typeof vi.fn>;
    };
    NR.next.mockClear();
    NR.redirect.mockClear();
  });

  it('should allow access to public routes when not authenticated', async () => {
    const { middleware } = await import('@/middleware');
    // Mock unauthenticated user
    vi.mocked(getToken).mockResolvedValue(null);

    // Test with public route
    mockRequest.nextUrl.pathname = '/';

    await middleware(mockRequest);
    // Should not redirect and allow access
    expect(NextResponse.next).toHaveBeenCalledTimes(1);
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('should redirect to sign in when accessing protected route without auth', async () => {
    const { middleware } = await import('@/middleware');
    // Mock unauthenticated user
    vi.mocked(getToken).mockResolvedValue(null);

    // Test with protected route
    mockRequest.nextUrl.pathname = '/profile';

    await middleware(mockRequest);
    // Should redirect to sign in page
    expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      new URL('http://localhost:3000/auth/signin?callbackUrl=%2Fprofile'),
    );
  });

  it('should allow access to protected routes when authenticated', async () => {
    const { middleware } = await import('@/middleware');
    // Mock authenticated user
    vi.mocked(getToken).mockResolvedValue({
      sub: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    });

    // Test with protected route
    mockRequest.nextUrl.pathname = '/profile';

    await middleware(mockRequest);
    // Should not redirect and allow access
    expect(NextResponse.next).toHaveBeenCalledTimes(1);
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('should protect dashboard routes', async () => {
    const { middleware } = await import('@/middleware');
    // Mock unauthenticated user
    vi.mocked(getToken).mockResolvedValue(null);

    // Test with dashboard route
    mockRequest.nextUrl.pathname = '/dashboard/analytics';

    await middleware(mockRequest);
    // Should redirect to sign in page
    expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      new URL('http://localhost:3000/auth/signin?callbackUrl=%2Fdashboard%2Fanalytics'),
    );
  });

  it('should protect creation routes', async () => {
    const { middleware } = await import('@/middleware');
    // Mock unauthenticated user
    vi.mocked(getToken).mockResolvedValue(null);

    // Test with creation route
    mockRequest.nextUrl.pathname = '/restaurant/create';

    await middleware(mockRequest);
    // Should redirect to sign in page
    expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      new URL('http://localhost:3000/auth/signin?callbackUrl=%2Frestaurant%2Fcreate'),
    );
  });
});
