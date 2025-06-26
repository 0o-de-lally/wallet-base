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
 * Formats a number as currency with locale formatting and no decimals
 * @param value The value to format
 * @returns A formatted currency string
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

/**
 * Shortens an address by showing first and last characters
 * @param address The full address
 * @param prefixLength Number of characters to show at the beginning (default: 6)
 * @param suffixLength Number of characters to show at the end (default: 4)
 * @returns Shortened address with ellipsis, without 0x prefix and leading zeros
 */
export function shortenAddress(
  address: string,
  prefixLength: number = 6,
  suffixLength: number = 4,
): string {
  if (!address) {
    return address;
  }

  // Remove 0x prefix if present
  let cleanAddress = address.startsWith('0x') ? address.slice(2) : address;

  // Remove leading zeros
  cleanAddress = cleanAddress.replace(/^0+/, '');

  // If all characters were zeros, keep at least one
  if (cleanAddress === '') {
    cleanAddress = '0';
  }

  if (cleanAddress.length <= prefixLength + suffixLength) {
    return cleanAddress;
  }

  return `${cleanAddress.slice(0, prefixLength)}...${cleanAddress.slice(-suffixLength)}`;
}
