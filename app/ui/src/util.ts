export const labelToUniqueHexColor = (label: string): string => {
  // Create a hash of the label
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash << 5) - hash + label.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Generate RGB values from the hash
  const r = (hash & 0xff0000) >> 16; // Extract red
  const g = (hash & 0x00ff00) >> 8; // Extract green
  const b = hash & 0x0000ff; // Extract blue

  // Convert to hex and return the color
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`;
};

export const formatConfidence = (confidedence: number): string => {
  return `${Math.round(confidedence * 100)}%`;
};

export const formatHourToLocalTime = (utcHour: number): number => {
  const date = new Date();
  date.setUTCHours(utcHour, 0, 0, 0);
  return date.getHours();
};
