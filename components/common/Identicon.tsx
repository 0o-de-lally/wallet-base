import React, { memo } from "react";
import { View, ViewStyle } from "react-native";
import { colors } from "../../styles/styles";

interface IdenticonProps {
  address: string;
  size?: number;
  style?: ViewStyle;
}

/**
 * Generates a deterministic identicon based on account address
 * Creates a simple 5x5 grid pattern with colors derived from the address
 */
export const Identicon = memo(({ address, size = 32, style }: IdenticonProps) => {
  // Generate a simple hash from the address
  const generateHash = (input: string): number => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  };

  // Generate a deterministic color palette from the address
  const generateColors = (hash: number): string[] => {
    const baseColors = [
      colors.primary,
      "#FF6B6B", // coral
      "#4ECDC4", // teal
      "#45B7D1", // blue
      "#96CEB4", // mint
      "#FFEAA7", // yellow
      "#DDA0DD", // plum
      "#98D8C8", // aqua
      "#F7DC6F", // gold
      "#BB8FCE", // lavender
    ];
    
    const colorIndex = hash % baseColors.length;
    const backgroundColor = baseColors[colorIndex];
    
    // Generate a complementary lighter shade for inactive cells
    const lighterShade = backgroundColor + "40"; // Add alpha for transparency
    
    return [backgroundColor, lighterShade];
  };

  // Generate pattern data
  const hash = generateHash(address);
  const [activeColor, inactiveColor] = generateColors(hash);
  
  // Create a 5x5 grid pattern
  const gridSize = 5;
  const pattern: boolean[] = [];
  
  // Use the hash to determine which cells are active
  // We'll make it symmetric by only generating half and mirroring
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < Math.ceil(gridSize / 2); col++) {
      const cellHash = hash + (row * gridSize) + col;
      const isActive = cellHash % 2 === 0;
      
      // Add the cell
      pattern[row * gridSize + col] = isActive;
      
      // Mirror it to the other side (except for the middle column)
      if (col < Math.floor(gridSize / 2)) {
        const mirrorCol = gridSize - 1 - col;
        pattern[row * gridSize + mirrorCol] = isActive;
      }
    }
  }

  const cellSize = size / gridSize;
  const borderRadius = size * 0.1; // 10% of the total size for rounded corners

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          backgroundColor: colors.cardBg,
          borderRadius,
          overflow: "hidden",
          flexDirection: "row",
          flexWrap: "wrap",
        },
        style,
      ]}
    >
      {pattern.map((isActive, index) => (
        <View
          key={index}
          style={{
            width: cellSize,
            height: cellSize,
            backgroundColor: isActive ? activeColor : inactiveColor,
          }}
        />
      ))}
    </View>
  );
});

Identicon.displayName = "Identicon";
