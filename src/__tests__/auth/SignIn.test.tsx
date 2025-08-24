import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignIn from '@/app/auth/signin/page';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock next-auth functions
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

// Mock next/navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe('SignIn Page', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Mock router
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);

    // Mock default search params
    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn((param: string) => (param === 'callbackUrl' ? '/' : null)),
    } as unknown as ReturnType<typeof useSearchParams>);

    // Mock signIn function
    vi.mocked(signIn).mockResolvedValue({ ok: true, error: null } as never);
  });

  it('should render sign in options', () => {
    render(<SignIn />);

    // Check if the heading is rendered
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();

    // Check if provider buttons are rendered
    expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
  });

  it('should call signIn with GitHub provider when GitHub button is clicked', async () => {
    render(<SignIn />);

    // Click on the GitHub sign in button
    fireEvent.click(screen.getByRole('button', { name: /github/i }));

    // Check if signIn was called with the correct provider and options
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('github', { callbackUrl: '/' });
    });
  });

  it('should call signIn with Google provider when Google button is clicked', async () => {
    render(<SignIn />);

    // Click on the Google sign in button
    fireEvent.click(screen.getByRole('button', { name: /google/i }));

    // Check if signIn was called with the correct provider and options
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/' });
    });
  });

  it('should use custom callbackUrl from search params when available', async () => {
    // Mock search params with custom callbackUrl
    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn((param: string) => (param === 'callbackUrl' ? '/dashboard' : null)),
    } as unknown as ReturnType<typeof useSearchParams>);

    render(<SignIn />);

    // Click on the GitHub sign in button
    fireEvent.click(screen.getByRole('button', { name: /github/i }));

    // Check if signIn was called with the correct callbackUrl
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('github', { callbackUrl: '/dashboard' });
    });
  });

  it('should show loading state while signing in', async () => {
    render(<SignIn />);

    // Click on the GitHub sign in button
    fireEvent.click(screen.getByRole('button', { name: /github/i }));

    // Check if button shows loading state
    expect(screen.getByText('Signing in...')).toBeInTheDocument();

    // Wait for signIn to complete
    await waitFor(() => {
      expect(signIn).toHaveBeenCalled();
    });
  });
});
