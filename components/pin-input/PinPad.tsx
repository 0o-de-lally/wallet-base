import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PinPadProps {
  onNumberPress: (number: string) => void;
  onDeletePress: () => void;
  pinLength?: number;
  currentLength: number;
}

export function PinPad({
  onNumberPress,
  onDeletePress,
  pinLength = 6,
  currentLength,
}: PinPadProps) {
  // Generate an array of digits from 0-9
  const [digits, setDigits] = useState<string[]>([]);
  // Track if buttons should display their values or be masked
  const [showDigits, setShowDigits] = useState(true);

  // Shuffle the digits on component mount
  useEffect(() => {
    scrambleDigits();
  }, []);

  // Function to shuffle the digits array
  const scrambleDigits = () => {
    const numberArray = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
    // Fisher-Yates shuffle algorithm
    for (let i = numberArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numberArray[i], numberArray[j]] = [numberArray[j], numberArray[i]];
    }
    setDigits(numberArray);
  };

  // Handle button press with masking
  const handleButtonPress = (number: string) => {
    Vibration.vibrate(10); // Subtle haptic feedback

    // Temporarily mask all buttons
    setShowDigits(false);
    onNumberPress(number);

    // After a short delay, show the digits again
    setTimeout(() => {
      setShowDigits(true);
    }, 300);
  };

  // Render the PIN pad grid
  return (
    <View style={pinPadStyles.container}>
      <View style={pinPadStyles.dotsContainer}>
        {Array.from({ length: pinLength }).map((_, index) => (
          <View
            key={index}
            style={[
              pinPadStyles.dot,
              index < currentLength && pinPadStyles.dotFilled,
            ]}
          />
        ))}
      </View>
      <View style={pinPadStyles.padContainer}>
        <View style={pinPadStyles.row}>
          {digits.slice(0, 3).map((digit) => (
            <TouchableOpacity
              key={digit}
              style={pinPadStyles.button}
              onPress={() => handleButtonPress(digit)}
            >
              <Text style={pinPadStyles.buttonText}>
                {showDigits ? digit : "*"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={pinPadStyles.row}>
          {digits.slice(3, 6).map((digit) => (
            <TouchableOpacity
              key={digit}
              style={pinPadStyles.button}
              onPress={() => handleButtonPress(digit)}
            >
              <Text style={pinPadStyles.buttonText}>
                {showDigits ? digit : "*"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={pinPadStyles.row}>
          {digits.slice(6, 9).map((digit) => (
            <TouchableOpacity
              key={digit}
              style={pinPadStyles.button}
              onPress={() => handleButtonPress(digit)}
            >
              <Text style={pinPadStyles.buttonText}>
                {showDigits ? digit : "*"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={pinPadStyles.row}>
          <View style={pinPadStyles.button} />
          <TouchableOpacity
            style={pinPadStyles.button}
            onPress={() => handleButtonPress(digits[9])}
          >
            <Text style={pinPadStyles.buttonText}>
              {showDigits ? digits[9] : "*"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={pinPadStyles.button} onPress={onDeletePress}>
            <Ionicons name="backspace-outline" size={24} color="#f0f0f5" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const pinPadStyles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    marginTop: 16,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c2c2cc",
    marginHorizontal: 8,
  },
  dotFilled: {
    backgroundColor: "#94c2f3",
    borderColor: "#94c2f3",
  },
  padContainer: {
    width: "100%",
    maxWidth: 300,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#25252d",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444455",
  },
  buttonText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f0f0f5",
  },
});
