import React, { useState, useCallback, useEffect } from "react";
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

  // Update parent component with PIN as it changes
  useEffect(() => {
    onPinComplete(pin);
  }, [pin, onPinComplete]);

  const handleNumberPress = useCallback(
    (number: string) => {
      setPin((current) => {
        if (current.length < pinLength) {
          return current + number;
        }
        return current;
      });
    },
    [pinLength],
  );

  const handleDeletePress = useCallback(() => {
    setPin((current) => current.slice(0, -1));
  }, []);

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
