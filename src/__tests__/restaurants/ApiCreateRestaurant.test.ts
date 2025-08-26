import { describe, it, expect, vi } from 'vitest';
import { prisma } from '@/lib/db';

// Mock auth to avoid loading NextAuth internals and to control auth state
vi.mock('@/auth', () => ({ auth: vi.fn() }));

async function getAuth() {
  const mod = await import('@/auth');
  return vi.mocked((mod as any).auth as ReturnType<typeof vi.fn>);
}

describe('POST /api/restaurants', () => {
  it('should return 400 if required fields are missing (authenticated)', async () => {
    const user = await prisma.user.create({ data: { email: 'api400@example.com', name: 'API400' } });
    const auth = await getAuth();
    auth.mockResolvedValueOnce({ user: { id: user.id } } as any);
    const { POST } = await import('@/app/api/restaurants/route');
    const req = {
      json: async () => ({ name: '' }),
    } as any;
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should create a restaurant with valid data', async () => {
    const creator = await prisma.user.create({ data: { email: 'api201@example.com', name: 'API201' } });
    const auth = await getAuth();
    auth.mockResolvedValueOnce({ user: { id: creator.id, email: creator.email } } as any);
    const { POST } = await import('@/app/api/restaurants/route');
    const req = {
      json: async () => ({
        name: 'Test Restaurant',
        address: '123 Main St',
        city: 'Testville',
        country: 'Testland',
        postcode: '12345',
        latitude: 51.5,
        timezone: 'Europe/London',
        phone: '1234567890',
        email: 'test@example.com',
        description: 'A test restaurant',
        imageUrl: 'https://example.com/image.jpg',
      }),
    } as any;
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.name).toBe('Test Restaurant');
    expect(data.slug).toBe('test-restaurant');
  });
});
