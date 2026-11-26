// Fechas ISO 'YYYY-MM-DD' en UTC, sin zonas horarias.

function parse(iso: string): [number, number, number] {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) throw new Error(`Fecha inválida: ${iso}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

const pad = (n: number) => String(n).padStart(2, '0');

function toUtc(iso: string): number {
  const [y, m, d] = parse(iso);
  return Date.UTC(y, m - 1, d);
}

/** Suma meses; si el día no existe en el mes destino, usa el último día. */
export function addMonths(iso: string, months: number): string {
  const [y, m, d] = parse(iso);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = total - ny * 12;
  const lastDay = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return `${ny}-${pad(nm + 1)}-${pad(Math.min(d, lastDay))}`;
}

/** Días de a a b (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}

/** Meses completos de a a b (b − a), puede ser negativo. */
export function monthsBetween(a: string, b: string): number {
  const [ya, ma, da] = parse(a);
  const [yb, mb, db] = parse(b);
  let months = (yb - ya) * 12 + (mb - ma);
  if (months > 0 && db < da) months -= 1;
  if (months < 0 && db > da) months += 1;
  return months;
}

export function isAfter(a: string, b: string): boolean {
  return toUtc(a) > toUtc(b);
}

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** '2027-10-08' → '8 oct 2027'; con { day: false } → 'oct 2027'. */
export function formatDate(iso: string, opts: { day?: boolean } = {}): string {
  const [y, m, d] = parse(iso);
  const month = `${MONTHS_ES[m - 1]} ${y}`;
  return opts.day === false ? month : `${d} ${month}`;
}
