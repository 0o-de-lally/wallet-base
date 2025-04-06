/**
 * Formats a timestamp into a readable date string
 * @param timestamp The timestamp to format (in milliseconds)
 * @returns A formatted date string
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats a number as currency
 * @param value The value to format
 * @param decimals Number of decimal places
 * @returns A formatted currency string
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Truncates a string in the middle, useful for long addresses
 * @param str The string to truncate
 * @param startChars Characters to keep at the start
 * @param endChars Characters to keep at the end
 * @returns The truncated string
 */
export function truncateMiddle(
  str: string,
  startChars: number = 6,
  endChars: number = 4,
): string {
  if (!str) return "";
  if (str.length <= startChars + endChars) return str;

  return `${str.substring(0, startChars)}...${str.substring(str.length - endChars)}`;
}
