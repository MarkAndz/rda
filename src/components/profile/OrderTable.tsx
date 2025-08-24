'use client';

import React, { Fragment, useId, useState } from 'react';
import { formatCents, formatDateTime } from '@/lib/format';

export type OrderRow = {
  id: string;
  createdAt: Date | string;
  status: string;
  totalCents: number;
  restaurant: { name: string } | null;
  items: { quantity: number; priceCentsAtPurchase: number; item: { name: string } | null }[];
};

export function OrderTable({ orders }: { orders: OrderRow[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const baseId = useId();

  const toggle = (id: string) => setOpen((s) => ({ ...s, [id]: !s[id] }));

  if (orders.length === 0) {
    return (
      <div className="rounded border border-dashed p-8 text-center text-gray-600">
        No orders yet.
      </div>
    );
  }

  return (
    <table className="w-full table-fixed border-collapse text-left text-sm">
      <colgroup>
        <col className="w-[16%]" />
        <col className="w-[20%]" />
        <col className="w-[22%]" />
        <col className="w-[10%]" />
        <col className="w-[12%]" />
        <col className="w-[20%]" />
      </colgroup>
      <thead>
        <tr className="border-b text-gray-600">
          <th className="py-2">Order</th>
          <th className="py-2">Date</th>
          <th className="py-2">Restaurant</th>
          <th className="py-2">Items</th>
          <th className="py-2">Status</th>
          <th className="py-2">Total</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o, idx) => {
          const itemsCount = o.items.reduce((n, it) => n + (it.quantity || 0), 0);
          const shortId = o.id.slice(0, 8);
          const detailsId = `${baseId}-${idx}`;
          const isOpen = !!open[o.id];
          return (
            <Fragment key={o.id}>
              <tr className="border-b align-top">
                <td className="py-3 font-mono text-xs text-gray-700">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={detailsId}
                    onClick={() => toggle(o.id)}
                    className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded border text-gray-600 hover:bg-gray-50"
                    data-testid={`expand-${o.id}`}
                    title={isOpen ? 'Hide details' : 'Show details'}
                  >
                    {isOpen ? '−' : '+'}
                  </button>
                  #{shortId}
                </td>
                <td className="py-3 text-gray-800">{formatDateTime(new Date(o.createdAt))}</td>
                <td className="py-3 text-gray-800">{o.restaurant?.name || '-'}</td>
                <td className="py-3 text-gray-800">{itemsCount}</td>
                <td className="py-3">
                  <span
                    className={
                      'inline-flex items-center rounded px-2 py-0.5 text-xs ' +
                      (o.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : o.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800')
                    }
                  >
                    {o.status}
                  </span>
                </td>
                <td className="py-3 font-medium text-gray-900">{formatCents(o.totalCents)}</td>
              </tr>
              {isOpen && (
                <tr className="border-b bg-gray-50/50" aria-live="polite">
                  <td id={detailsId} colSpan={6} className="py-3">
                    <div className="px-2">
                      <div className="mb-2 text-xs font-semibold text-gray-600 uppercase">
                        Items
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-600">
                            <th className="py-1 text-left">Name</th>
                            <th className="py-1 text-left">Qty</th>
                            <th className="py-1 text-left">Price</th>
                            <th className="py-1 text-left">Line total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {o.items.map((it, i) => {
                            const lineTotal = (it.quantity || 0) * (it.priceCentsAtPurchase || 0);
                            return (
                              <tr key={i} className="">
                                <td className="py-1 text-gray-800">{it.item?.name || '-'}</td>
                                <td className="py-1 text-gray-800">{it.quantity}</td>
                                <td className="py-1 text-gray-800">
                                  {formatCents(it.priceCentsAtPurchase)}
                                </td>
                                <td className="py-1 font-medium text-gray-900">
                                  {formatCents(lineTotal)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="mt-3 border-t pt-2 text-right text-sm">
                        <span className="mr-2 text-gray-600">Order total:</span>
                        <span className="font-semibold text-gray-900">
                          {formatCents(o.totalCents)}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

export default OrderTable;
