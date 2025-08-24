import { auth } from '@/auth';
import { prisma } from '@/lib/db';

function toCsvRow(values: (string | number | null | undefined)[]) {
  return values
    .map((v) => {
      const s = v == null ? '' : String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    })
    .join(',');
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(req.url);
  const sp = url.searchParams;
  const statusRaw = (sp.get('status') || '').toUpperCase();
  const validStatuses = new Set(['PENDING', 'COMPLETED', 'CANCELLED']);
  const statusFilter = validStatuses.has(statusRaw)
    ? (statusRaw as 'PENDING' | 'COMPLETED' | 'CANCELLED')
    : undefined;
  const fromStr = sp.get('from') || undefined;
  const toStr = sp.get('to') || undefined;
  const fromDate = fromStr ? new Date(fromStr) : undefined;
  const toDate = toStr ? new Date(toStr) : undefined;
  if (toDate) toDate.setHours(23, 59, 59, 999);
  const sort = sp.get('sort') === 'oldest' ? 'oldest' : 'newest';

  const where = {
    customerId: session.user.id as string,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(fromDate || toDate
      ? {
          createdAt: { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) },
        }
      : {}),
  } as const;
  const orderBy = { createdAt: sort === 'oldest' ? 'asc' : 'desc' } as const;

  const orders = await prisma.order.findMany({
    where,
    orderBy,
    select: {
      id: true,
      createdAt: true,
      status: true,
      totalCents: true,
      restaurant: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });

  const header = [
    'order_id',
    'created_at',
    'status',
    'restaurant',
    'items_count',
    'total_cents',
    'currency',
  ];
  const rows = orders.map((o) =>
    toCsvRow([
      o.id,
      new Date(o.createdAt).toISOString(),
      o.status,
      o.restaurant?.name || '',
      o._count.items,
      o.totalCents,
      'EUR',
    ]),
  );
  const csv = [toCsvRow(header), ...rows].join('\n') + '\n';

  const today = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="orders-${today}.csv"`,
    },
  });
}
