export type BusTypeFeatures = { ac: boolean; sleeper: boolean };

export function getBusTypeFeatures(busType: string): BusTypeFeatures {
  const normalized = busType.toLowerCase();
  return { ac: !normalized.includes('non-ac'), sleeper: normalized.includes('sleeper') };
}
