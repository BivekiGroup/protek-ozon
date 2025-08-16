export const formatCurrency = (value: string | number | null | undefined, currency: string = 'RUB') => {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'string' ? Number(value) : value;
  if (!isFinite(Number(num))) return String(value);
  try {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency }).format(Number(num));
  } catch {
    return String(value);
  }
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
};

