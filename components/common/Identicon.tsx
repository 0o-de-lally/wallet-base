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
  // Fixed palette of consistently bright, electric colors - shuffled order to avoid bias
  const colorPalette = [
    "#FF6B6B", // Bright electric coral
    "#00E676", // Bright electric mint
    "#9C27B0", // Bright electric violet
    "#FFD93D", // Bright electric yellow
    "#00BCD4", // Bright electric teal
    "#FF1744", // Bright electric red
    "#448AFF", // Bright electric blue
    "#8BC34A", // Bright electric lime
    "#BB6BD9", // Bright electric purple
    "#FF9100", // Bright electric orange
    "#00D9FF", // Bright electric cyan
    "#FFC107", // Bright electric amber
    "#FF69B4", // Bright electric hot pink
    "#3F51B5", // Bright electric indigo
    "#E91E63", // Bright electric magenta
    "#00FF88", // Bright electric green
  ];

  // Generate deterministic colors from the address
  const generateGradientColors = (address: string): [string, string] => {
    // Remove 0x prefix if present
    const cleanAddress = address.startsWith("0x") ? address.slice(2) : address;

    // Remove all leading zeros to get the unique part
    const trimmedAddress = cleanAddress.replace(/^0+/, "") || "0";

    // Use a more robust hash function with better distribution
    const djb2Hash = (str: string) => {
      let hash = 5381;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
      }
      return Math.abs(hash);
    };

    // Use different parts of the address for each color selection
    const firstHalf = trimmedAddress.slice(0, Math.ceil(trimmedAddress.length / 2));
    const secondHalf = trimmedAddress.slice(Math.floor(trimmedAddress.length / 2));
    const reverseAddress = trimmedAddress.split('').reverse().join('');

    // Generate hashes from different representations
    const hash1 = djb2Hash(firstHalf);
    const hash2 = djb2Hash(secondHalf);
    const hash3 = djb2Hash(reverseAddress);
    const hash4 = djb2Hash(trimmedAddress);

    // Use simple modulo for better distribution
    const colorIndex1 = hash1 % colorPalette.length;
    let colorIndex2 = hash2 % colorPalette.length;

    // Ensure the second color is different from the first
    // Use a more robust approach that guarantees variety without blocking colors
    if (colorIndex2 === colorIndex1) {
      colorIndex2 = (colorIndex1 + (hash3 % (colorPalette.length - 1)) + 1) % colorPalette.length;
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
