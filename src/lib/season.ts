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
    return `${String(year).slice(2)}/${String(year + 1).slice(2)}`;
  } else {
    return `${String(year - 1).slice(2)}/${String(year).slice(2)}`;
  }
}

export function getNextSeason(season: string): string {
  const [start] = season.split("/");
  const startNum = parseInt(start);
  return `${String(startNum + 1).padStart(2, "0")}/${String(startNum + 2).padStart(2, "0")}`;
}

export function getPrevSeason(season: string): string {
  const [start] = season.split("/");
  const startNum = parseInt(start);
  return `${String(startNum - 1).padStart(2, "0")}/${String(startNum).padStart(2, "0")}`;
}
