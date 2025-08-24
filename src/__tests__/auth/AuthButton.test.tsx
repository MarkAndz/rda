import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthButton } from '@/components/auth/AuthButton';
import { useSession } from 'next-auth/react';

// Mock next-auth hooks and functions
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock next/link component
vi.mock('next/link', () => ({
  default: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => (
    <a {...props}>{children}</a>
  ),
}));
describe('AuthButton', () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should show loading state when session is loading', () => {
    // Mock the useSession hook to return loading state
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'loading',
      update: vi.fn(),
    });

    render(<AuthButton />);

    // Check if loading state is rendered
    const loadingElement = screen.getByTestId('auth-loading');
    expect(loadingElement).toBeInTheDocument();
  });

  it('should show sign in button when user is not authenticated', () => {
    // Mock the useSession hook to return unauthenticated state
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });

    render(<AuthButton />);

    // Check if sign in button is rendered
    const signInButton = screen.getByTestId('sign-in-button');
    expect(signInButton).toBeInTheDocument();
  });

  it('should show user info and dropdown when user is authenticated', () => {
    // Mock the useSession hook to return authenticated state
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          image: 'https://example.com/avatar.png',
        },
        expires: '2023-01-01',
      },
      status: 'authenticated',
      update: vi.fn(),
    });

    render(<AuthButton />);

    // Check if user name is rendered
    expect(screen.getByText('Test User')).toBeInTheDocument();

    // Check if user image is rendered
    const userImage = screen.getByAltText('Test User');
    expect(userImage).toBeInTheDocument();
    expect(userImage).toHaveAttribute('src', 'https://example.com/avatar.png');
  });
});
