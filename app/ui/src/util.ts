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

// Returns black or white text color based on background luminance
export const getContrastTextColor = (hexColor: string): string => {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // Calculate relative luminance (WCAG formula)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

export const formatConfidence = (confidedence: number): string => {
  return `${Math.round(confidedence * 100)}%`;
};

export const formatHourToLocalTime = (utcHour: number): number => {
  const date = new Date();
  date.setUTCHours(utcHour, 0, 0, 0);
  return date.getHours();
};
