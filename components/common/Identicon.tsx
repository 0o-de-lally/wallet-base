import React, { memo } from "react";
import { View, ViewStyle } from "react-native";

interface IdenticonProps {
  address: string;
  size?: number;
  style?: ViewStyle;
}

/**
 * Generates a deterministic identicon based on account address
 * Creates a thick horizontal gradient line unique to the address
 */
export const Identicon = memo(({ address, size = 32, style }: IdenticonProps) => {
  // Calculate width based on address text content
  // Format: "0x" + 8 characters (4+4 from shortenAddress) + optional nickname
  const calculateWidth = () => {
    // Base width for "0x1234...5678" - approximately 8-9 characters
    const baseCharWidth = size * 0.35; // Rough character width relative to size
    const baseWidth = baseCharWidth * 12; // "0x1234...5678" ≈ 12 character widths
    return Math.max(baseWidth, size * 2); // Minimum width relative to size
  };

  // Generate deterministic colors from the address
  const generateGradientColors = (address: string): [string, string] => {
    // Debug logging
    console.log('Identicon address input:', address);
    
    // Remove 0x prefix if present
    const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
    console.log('Clean address:', cleanAddress);
    
    // Remove all leading zeros to get the unique part
    const trimmedAddress = cleanAddress.replace(/^0+/, '') || '0';
    console.log('Trimmed address (no leading zeros):', trimmedAddress);
    
    // Ensure we have enough characters by padding the trimmed address
    const paddedAddress = trimmedAddress.padEnd(20, '0');
    console.log('Padded address:', paddedAddress);
    
    // Use a simple hash function
    const simpleHash = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash);
    };
    
    // Use different sections of the trimmed address
    const hash1 = simpleHash(paddedAddress.slice(0, 10)); // First half
    const hash2 = simpleHash(paddedAddress.slice(10, 20)); // Second half  
    const hash3 = simpleHash(paddedAddress.slice(0, 5)); // First quarter
    const hash4 = simpleHash(paddedAddress.slice(-5)); // Last 5 chars
    
    console.log('Hash values:', { hash1, hash2, hash3, hash4 });
    
    // Generate first color using hash combinations
    const hue1 = (hash1 + hash3) % 360;
    const saturation1 = 75 + ((hash1 % 7) * 3); // 75-95% for bright colors
    const lightness1 = 45 + ((hash1 % 5) * 4); // 45-65% for good contrast
    
    // Generate second color with different hash combination
    const hue2 = (hash2 + hash4 + 120) % 360; // Offset by 120°
    const saturation2 = 75 + ((hash2 % 7) * 3); // 75-95% for bright colors
    const lightness2 = 45 + ((hash2 % 5) * 4); // 45-65% for good contrast
    
    // Ensure colors are sufficiently different
    const hueDiff = Math.abs(hue1 - hue2);
    const adjustedHue2 = hueDiff < 90 ? (hue2 + 120) % 360 : hue2;
    
    console.log('HSL values:', { 
      hue1, saturation1, lightness1, 
      hue2: adjustedHue2, saturation2, lightness2 
    });
    
    // Convert HSL to RGB
    const hslToRgb = (h: number, s: number, l: number) => {
      s /= 100;
      l /= 100;
      const a = s * Math.min(l, 1 - l);
      const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color);
      };
      return { r: f(0), g: f(8), b: f(4) };
    };
    
    const rgb1 = hslToRgb(hue1, saturation1, lightness1);
    const rgb2 = hslToRgb(adjustedHue2, saturation2, lightness2);
    
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    const color1 = `#${toHex(rgb1.r)}${toHex(rgb1.g)}${toHex(rgb1.b)}`;
    const color2 = `#${toHex(rgb2.r)}${toHex(rgb2.g)}${toHex(rgb2.b)}`;
    
    console.log('Final colors:', { color1, color2 });
    
    return [color1, color2];
  };

  const [startColor, endColor] = generateGradientColors(address);
  const lineHeight = Math.max(3, size * 0.15); // Thick line, at least 3px
  const borderRadius = lineHeight / 2; // Rounded ends

  // Create a smooth gradient with multiple segments
  const gradientSteps = 12;

  // Simple RGB color interpolation function
  const interpolateColor = (start: string, end: string, factor: number): string => {
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };
    
    const startRgb = hexToRgb(start);
    const endRgb = hexToRgb(end);
    
    // Interpolate RGB values
    const r = Math.round(startRgb.r + (endRgb.r - startRgb.r) * factor);
    const g = Math.round(startRgb.g + (endRgb.g - startRgb.g) * factor);
    const b = Math.round(startRgb.b + (endRgb.b - startRgb.b) * factor);
    
    // Convert back to hex
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  return (
    <View
      style={[
        {
          height: lineHeight,
          justifyContent: "center",
          alignItems: "flex-start",
        },
        style,
      ]}
    >
      <View
        style={{
          flex: 1,
          height: lineHeight,
          borderRadius,
          flexDirection: "row",
          overflow: "hidden",
        }}
      >
        {Array.from({ length: gradientSteps }, (_, index) => {
          const factor = index / (gradientSteps - 1);
          const segmentColor = interpolateColor(startColor, endColor, factor);
          
          return (
            <View
              key={index}
              style={{
                flex: 1,
                height: lineHeight,
                backgroundColor: segmentColor,
              }}
            />
          );
        })}
      </View>
    </View>
  );
});

Identicon.displayName = "Identicon";
