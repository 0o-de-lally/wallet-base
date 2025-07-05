import React, { memo } from "react";
import { ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";

interface IdenticonProps {
  address: string;
  style?: ViewStyle;
}

/**
 * Generates a deterministic identicon based on account address
 * Creates a vertical gradient stripe unique to the address
 */
export const Identicon = memo(({ address, style }: IdenticonProps) => {
  // Fixed palette of consistently bright, electric colors that complement the app's style
  const colorPalette = [
    "#00D9FF", // Bright electric cyan
    "#00FF88", // Bright electric green
    "#FF6B6B", // Bright electric coral
    "#FFD93D", // Bright electric yellow
    "#BB6BD9", // Bright electric purple
    "#FF69B4", // Bright electric hot pink
    "#00E676", // Bright electric mint
    "#448AFF", // Bright electric blue
    "#FF1744", // Bright electric red
    "#E91E63", // Bright electric magenta
    "#9C27B0", // Bright electric violet
    "#FF9100", // Bright electric orange
    "#00BCD4", // Bright electric teal
    "#8BC34A", // Bright electric lime
    "#FFC107", // Bright electric amber
    "#3F51B5", // Bright electric indigo
  ];

  // Generate deterministic colors from the address
  const generateGradientColors = (address: string): [string, string] => {
    // Remove 0x prefix if present
    const cleanAddress = address.startsWith("0x") ? address.slice(2) : address;

    // Remove all leading zeros to get the unique part
    const trimmedAddress = cleanAddress.replace(/^0+/, "") || "0";

    // Ensure we have enough characters by padding the trimmed address
    const paddedAddress = trimmedAddress.padEnd(20, "0");

    // Use a better hash function for more even distribution
    const simpleHash = (str: string, seed: number = 0) => {
      let hash = seed;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash + char) & 0x7fffffff; // Keep positive
        hash = hash * 1013904223; // Large prime multiplier for better distribution
      }
      return Math.abs(hash);
    };

    // Use different strategies to ensure variety and better distribution
    const hash1 = simpleHash(paddedAddress.slice(0, 6), 17); // First part with seed
    const hash2 = simpleHash(paddedAddress.slice(6, 12), 31); // Middle part with different seed
    const hash3 = simpleHash(paddedAddress.slice(12), 53); // Last part with another seed
    const hash4 = simpleHash(paddedAddress, 73); // Whole address with different seed

    // Select colors using different hash combinations for better variety
    const colorIndex1 = (hash1 * 7 + hash3 * 11) % colorPalette.length;
    let colorIndex2 = (hash2 * 13 + hash4 * 17) % colorPalette.length;

    // Ensure the second color is different from the first
    // Use a more robust approach that guarantees variety without blocking colors
    if (colorIndex2 === colorIndex1) {
      colorIndex2 =
        (colorIndex1 + (hash3 % (colorPalette.length - 1)) + 1) %
        colorPalette.length;
    }

    return [colorPalette[colorIndex1], colorPalette[colorIndex2]];
  };

  const [startColor, endColor] = generateGradientColors(address);
  const stripeWidth = 6; // Fixed width of vertical stripe
  const borderRadius = stripeWidth / 2; // Rounded edges

  // Create a unique gradient ID based on the address to avoid conflicts
  const gradientId = `gradient-${address.slice(-8)}`;

  return (
    <Svg
      width={stripeWidth}
      height="100%"
      style={[
        {
          flex: 1,
          alignSelf: "stretch",
        },
        style,
      ]}
      preserveAspectRatio="none"
      viewBox={`0 0 ${stripeWidth} 100`}
    >
      <Defs>
        <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={startColor} />
          <Stop offset="100%" stopColor={endColor} />
        </LinearGradient>
      </Defs>
      <Rect
        x={0}
        y={0}
        width={stripeWidth}
        height={100}
        fill={`url(#${gradientId})`}
        rx={borderRadius}
        ry={borderRadius}
      />
    </Svg>
  );
});

Identicon.displayName = "Identicon";
