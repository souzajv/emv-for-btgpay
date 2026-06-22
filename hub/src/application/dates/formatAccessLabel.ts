function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * Rótulo de último acesso: "Hoje", "Ontem" ou data curta em pt-BR.
 */
export function formatAccessLabel(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diffDays = Math.floor(
    (startOfLocalDay(now) - startOfLocalDay(date)) / 86_400_000
  );

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";

  const sameYear = date.getFullYear() === now.getFullYear();
  const formatted = date.toLocaleDateString(
    "pt-BR",
    sameYear
      ? { day: "numeric", month: "short" }
      : { day: "numeric", month: "short", year: "numeric" }
  );

  return formatted.replace(/\./g, "").replace(/ de /g, " ");
}

export function isAccessToday(iso: string | undefined, now = new Date()): boolean {
  if (!iso) return false;
  return formatAccessLabel(iso, now) === "Hoje";
}
