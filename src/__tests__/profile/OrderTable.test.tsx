import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import OrderTable, { type OrderRow } from '@/components/profile/OrderTable';

function makeOrderRow(overrides?: Partial<OrderRow>): OrderRow {
  return {
    id: 'aaaaaaaa-1111-2222-3333',
    createdAt: new Date('2024-01-02T10:00:00Z'),
    status: 'COMPLETED',
    totalCents: 2599,
    restaurant: { name: 'Test Resto' },
    items: [
      { quantity: 1, priceCentsAtPurchase: 1599, item: { name: 'Burger' } },
      { quantity: 2, priceCentsAtPurchase: 500, item: { name: 'Fries' } },
    ],
    ...overrides,
  };
}

describe('OrderTable', () => {
  it('renders headers and columns (Short ID, Status, Created at, Restaurant, Items count, Total)', () => {
    render(<OrderTable orders={[makeOrderRow()]} />);
    expect(screen.getByText('Order')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Restaurant')).toBeInTheDocument();
    expect(screen.getByText('Items')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    // Short ID
    expect(screen.getByText(/#aaaaaaaa/i)).toBeInTheDocument();
    // Restaurant
    expect(screen.getByText('Test Resto')).toBeInTheDocument();
    // Items count (1 + 2)
    expect(screen.getByText('3')).toBeInTheDocument();
    // Status and total
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('€25.99')).toBeInTheDocument();
  });

  it('expands a row to show items with name, qty, and price', () => {
    const order = makeOrderRow();
    render(<OrderTable orders={[order]} />);
    const expand = screen.getByTestId(`expand-${order.id}`);
    fireEvent.click(expand);
    const detailsId = expand.getAttribute('aria-controls');
    expect(detailsId).toBeTruthy();
    const details = document.getElementById(detailsId!);
    expect(details).toBeTruthy();
    // Assert the section heading within the expanded details, not the table header
    expect(within(details as HTMLElement).getByText('Items')).toBeInTheDocument();
    // Scope checks to the expanded details to avoid ambiguous matches
    const burgerCell = within(details as HTMLElement).getByText('Burger');
    const burgerRow = burgerCell.closest('tr') as HTMLTableRowElement;
    expect(burgerRow).toBeTruthy();
    expect(within(burgerRow).getByText('1')).toBeInTheDocument();
    // Price and Line total can both equal €15.99 for quantity 1; ensure at least one match (ideally two)
    expect(within(burgerRow).getAllByText('€15.99').length).toBeGreaterThan(0);
    // Also ensure Fries row is present
    expect(within(details as HTMLElement).getByText('Fries')).toBeInTheDocument();
  });

  it('renders a View link to the order details page', () => {
    const order = makeOrderRow();
    render(<OrderTable orders={[order]} />);
    const link = screen.getByRole('link', { name: /view/i });
    expect(link).toHaveAttribute('href', `/profile/orders/${order.id}`);
  });
});
