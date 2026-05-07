export interface MonetaryEntry {
  label: string;
  value: number;
  type?: 'amount' | 'percent';
}

export interface MonetaryEntryFormValue {
  label: string;
  value: string;
  type?: 'amount' | 'percent';
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeMonetaryEntries(entries: unknown): MonetaryEntry[] {
  if (!Array.isArray(entries)) return [];

  return entries
    .map((entry) => {
      const raw = entry as { label?: unknown; value?: unknown; type?: unknown };
      return {
        label: String(raw?.label || "").trim(),
        value: toNumber(raw?.value),
        type: (raw?.type === 'percent' ? 'percent' : 'amount') as 'amount' | 'percent',
      };
    })
    .filter((entry) => entry.label || entry.value > 0);
}

export function sumMonetaryEntries(entries?: MonetaryEntry[], baseValue: number = 0): number {
  return (entries || []).reduce((sum, entry) => {
    const val = toNumber(entry.value);
    if (entry.type === 'percent' && baseValue > 0) {
      return sum + (baseValue * (val / 100));
    }
    return sum + val;
  }, 0);
}

export function numberToFormValue(value?: number): string {
  return value && value > 0 ? String(value) : "";
}

export function toMonetaryEntryFormValues(
  entries?: MonetaryEntry[],
): MonetaryEntryFormValue[] {
  return (entries || []).map((entry) => ({
    label: entry.label || "",
    value: numberToFormValue(entry.value),
    type: entry.type || 'amount',
  }));
}
