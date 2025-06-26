import { FORMATTING } from "./constants";

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
 * Formats a number as currency with locale formatting and decimals
 * @param value The value to format
 * @param decimals Number of decimal places to show (default: 2)
 * @returns A formatted currency string
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  // If the value is exactly 0, return "0" without decimals
  if (value === 0) {
    return "0";
  }

  return new Intl.NumberFormat(undefined, {
    style: "decimal",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formats a Libra token amount with appropriate decimal places
 * @param value The value to format (already scaled)
 * @returns A formatted token amount string
 */
export function formatLibraAmount(value: number): string {
  // If the value is exactly 0, return "0" without decimals
  if (value === 0) {
    return "0";
  }

  // For small amounts, show more decimals
  if (value < 1) {
    return formatCurrency(value, FORMATTING.DECIMAL_PLACES.SMALL_AMOUNT);
  } else if (value < 100) {
    return formatCurrency(value, FORMATTING.DECIMAL_PLACES.MEDIUM_AMOUNT);
  } else {
    return formatCurrency(value, FORMATTING.DECIMAL_PLACES.LARGE_AMOUNT);
  }
}

/**
 * Shortens an address by showing first and last characters
 * @param address The full address
 * @param prefixLength Number of characters to show at the beginning (default: from constants)
 * @param suffixLength Number of characters to show at the end (default: from constants)
 * @returns Shortened address with ellipsis
 */
export function shortenAddress(
  address: string,
  prefixLength: number = FORMATTING.ADDRESS_PREFIX_LENGTH,
  suffixLength: number = FORMATTING.ADDRESS_SUFFIX_LENGTH,
): string {
  if (!address || address.length <= prefixLength + suffixLength) {
    return address;
  }
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}
