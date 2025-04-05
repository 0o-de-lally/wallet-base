import React, { useState, useCallback } from "react";
import { View, StyleSheet, Text } from "react-native";
import { PinPad } from "./PinPad";
import { styles } from "../../styles/styles";

interface CustomPinInputProps {
  onPinComplete: (pin: string) => void;
  title?: string;
  subtitle?: string;
  pinLength?: number;
  error?: string | null;
}

export function CustomPinInput({
  onPinComplete,
  title = "Enter PIN",
  subtitle,
  pinLength = 6,
  error,
}: CustomPinInputProps) {
  const [pin, setPin] = useState<string>("");

  const handleNumberPress = useCallback(
    (number: string) => {
      setPin((current) => {
        const newPin = current.length < pinLength ? current + number : current;

        // Only call onPinComplete when the PIN changes, not on every render
        if (newPin !== current) {
          onPinComplete(newPin);
        }

        return newPin;
      });
    },
    [pinLength, onPinComplete],
  );

  const handleDeletePress = useCallback(() => {
    setPin((current) => {
      const newPin = current.slice(0, -1);

      // Only call onPinComplete when the PIN changes, not on every render
      if (newPin !== current) {
        onPinComplete(newPin);
      }

      return newPin;
    });
  }, [onPinComplete]);

  return (
    <View style={customStyles.container}>
      {title && <Text style={styles.modalTitle}>{title}</Text>}
      {subtitle && <Text style={styles.modalSubtitle}>{subtitle}</Text>}

      <PinPad
        onNumberPress={handleNumberPress}
        onDeletePress={handleDeletePress}
        pinLength={pinLength}
        currentLength={pin.length}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const customStyles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
});
