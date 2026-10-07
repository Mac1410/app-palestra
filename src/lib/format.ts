const DAY_MS = 24 * 60 * 60 * 1000;

const dateFormatter = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('it-IT', {
  hour: '2-digit',
  minute: '2-digit',
});

export const WEEKDAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export function formatDate(ts: number): string {
  return dateFormatter.format(new Date(ts));
}

export function formatShortDate(ts: number): string {
  return shortDateFormatter.format(new Date(ts));
}

export function formatTime(ts: number): string {
  return timeFormatter.format(new Date(ts));
}

/** "Oggi", "Ieri" oppure la data estesa. */
export function formatRelativeDay(ts: number): string {
  const start = startOfDay(Date.now());
  const target = startOfDay(ts);
  const diffDays = Math.round((start - target) / DAY_MS);
  if (diffDays === 0) return 'Oggi';
  if (diffDays === 1) return 'Ieri';
  if (diffDays < 7 && diffDays > 0) return `${diffDays} giorni fa`;
  return formatDate(ts);
}

/** Durata in mm:ss (o h:mm:ss oltre l'ora). */
export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Durata compatta per riepiloghi: "1h 12m" oppure "48m". */
export function formatDurationShort(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.round((total % 3600) / 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m`;
}

/**
 * Numero in formato italiano: punto per le migliaia, virgola per i decimali.
 * Scritto a mano perché il raggruppamento di `Intl.NumberFormat` non è
 * garantito su tutti i runtime JavaScript su cui gira l'app.
 */
export function formatNumber(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return '0';
  const sign = value < 0 ? '-' : '';
  const [whole, fraction = ''] = Math.abs(value).toFixed(decimals).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const trimmed = fraction.replace(/0+$/, '');
  return trimmed ? `${sign}${grouped},${trimmed}` : `${sign}${grouped}`;
}

export function formatWeight(kg: number): string {
  return `${formatNumber(kg, 1)} kg`;
}

/** Volume in kg, abbreviato in tonnellate sopra le 10.000 unità. */
export function formatVolume(kg: number): string {
  if (kg >= 10000) return `${formatNumber(kg / 1000, 1)} t`;
  return `${formatNumber(kg, 0)} kg`;
}

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Lunedì della settimana a cui appartiene `ts`. */
export function startOfWeek(ts: number): number {
  const d = new Date(startOfDay(ts));
  const day = (d.getDay() + 6) % 7; // 0 = lunedì
  d.setDate(d.getDate() - day);
  return d.getTime();
}

export function addDays(ts: number, days: number): number {
  const d = new Date(ts);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

export function isSameDay(a: number, b: number): boolean {
  return startOfDay(a) === startOfDay(b);
}

/** Saluto in base all'ora del giorno. */
export function greeting(ts = Date.now()): string {
  const hour = new Date(ts).getHours();
  if (hour < 12) return 'Buongiorno';
  if (hour < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}
