/**
 * Converts a hex color string to an rgba string with the specified opacity.
 * @param hex The hex color string (e.g., "#FF0000" or "FF0000").
 * @param opacity The opacity value between 0 and 1.
 * @returns The rgba string.
 */
export function hexToRgba(hex: string, opacity: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
