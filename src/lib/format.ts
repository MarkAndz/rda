export function formatCents(amountCents: number, locale = 'en-US', currency = 'EUR') {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(
      (amountCents || 0) / 100,
    );
  } catch {
    // Fallback if currency/locale not supported
    return `€${((amountCents || 0) / 100).toFixed(2)}`;
  }
}

export function formatDateTime(dt: Date, locale = 'en-GB') {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dt));
  } catch {
    return new Date(dt).toISOString();
  }
}
