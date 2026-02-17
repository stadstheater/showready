/**
 * Format a year number as a two-digit string with zero-padding.
 */
function formatYearShort(year: number): string {
  return String(year % 100).padStart(2, "0");
}

/**
 * Get the current theater season based on date.
 * Theater season runs Aug-Jul. If current month >= August, season is currentYear/nextYear.
 */
export function getCurrentSeason(): string {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const year = now.getFullYear();

  if (month >= 7) {
    // August (7) or later
    return `${formatYearShort(year)}/${formatYearShort(year + 1)}`;
  } else {
    return `${formatYearShort(year - 1)}/${formatYearShort(year)}`;
  }
}

export function getNextSeason(season: string): string {
  const [start] = season.split("/");
  const startNum = parseInt(start, 10);
  if (isNaN(startNum)) throw new Error(`Ongeldig seizoensformaat: ${season}`);
  return `${formatYearShort(startNum + 1)}/${formatYearShort(startNum + 2)}`;
}

export function getPrevSeason(season: string): string {
  const [start] = season.split("/");
  const startNum = parseInt(start, 10);
  if (isNaN(startNum)) throw new Error(`Ongeldig seizoensformaat: ${season}`);
  return `${formatYearShort(startNum - 1)}/${formatYearShort(startNum)}`;
}
