import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Countdown from '@/components/restaurants/Countdown';

describe('Countdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders when within 10 minutes', () => {
    const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    render(<Countdown expiresAt={expires} />);
    expect(screen.getByText(/Ends in/i)).toBeInTheDocument();
  });

  it('does not render when expired', () => {
    const expires = new Date(Date.now() - 1000).toISOString();
    const { container } = render(<Countdown expiresAt={expires} />);
    expect(container.textContent).toBe('');
  });

  it('does not render when far away (>10m)', () => {
    const expires = new Date(Date.now() + 11 * 60 * 1000).toISOString();
    const { container } = render(<Countdown expiresAt={expires} />);
    expect(container.textContent).toBe('');
  });
});
