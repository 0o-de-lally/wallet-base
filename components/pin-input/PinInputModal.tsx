import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { getValue } from "../../util/secure-store";
import { comparePins, HashedPin } from "../../util/pin-security";
import { styles } from "../../styles/styles";
import { CustomPinInput } from "./CustomPinInput";

interface PinInputOverlayProps {
  visible: boolean;
  onClose: () => void;
  onPinVerified: (pin: string) => void;
  purpose: "save" | "retrieve" | "delete";
}

// Renamed from PinInputModal to PinInputOverlay to reflect its non-modal nature
export function PinInputOverlay({
  visible,
  onClose,
  onPinVerified,
  purpose,
}: PinInputOverlayProps) {
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentPin, setCurrentPin] = useState<string>("");

  if (!visible) {
    return null;
  }

  // Get action text based on purpose
  const getActionText = () => {
    switch (purpose) {
      case "save":
        return "save";
      case "retrieve":
        return "retrieve";
      case "delete":
        return "delete";
      default:
        return "access";
    }
  };

  const handlePinUpdate = (pin: string) => {
    setCurrentPin(pin);
    if (error) setError(null);
  };

  const handleVerifyPin = async () => {
    if (!currentPin) {
      setError("PIN is required");
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);

      // Get the stored hashed PIN
      const savedPinJson = await getValue("user_pin");

      if (!savedPinJson) {
        setError("No PIN has been set up. Please set up a PIN first.");
        return;
      }

      try {
        // Parse the stored PIN from JSON
        const storedHashedPin: HashedPin = JSON.parse(savedPinJson);

        // Use the comparePins function to properly compare PINs
        const isPinValid = await comparePins(storedHashedPin, currentPin);

        if (isPinValid) {
          // PIN verified successfully
          onPinVerified(currentPin);
          setCurrentPin("");
        } else {
          setError("Incorrect PIN. Please try again.");
        }
      } catch (parseError) {
        console.error("Error parsing stored PIN:", parseError);
        setError("PIN verification failed. Please set up your PIN again.");
      }
    } catch (error) {
      setError("Error verifying PIN. Please try again.");
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    setCurrentPin("");
    onClose();
  };

  return (
    <View style={overlayStyles.container}>
      <View style={overlayStyles.overlay}>
        <View style={overlayStyles.content}>
          {isVerifying ? (
            <View style={{ alignItems: "center", padding: 20 }}>
              <ActivityIndicator size="large" color="#94c2f3" />
              <Text style={[styles.modalSubtitle, { marginTop: 16 }]}>
                Verifying PIN...
              </Text>
            </View>
          ) : (
            <>
              <CustomPinInput
                onPinComplete={handlePinUpdate}
                title="Enter PIN"
                subtitle={`Please enter your PIN to ${getActionText()} this secure data.`}
                error={error}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.confirmButton,
                    currentPin.length !== 6 && { opacity: 0.6 },
                  ]}
                  onPress={handleVerifyPin}
                  disabled={currentPin.length !== 6}
                >
                  <Text style={styles.buttonText}>Verify</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const overlayStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 15, 20, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: "#25252d",
    borderRadius: 5,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    borderWidth: 2,
    borderColor: "#c2c2cc",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  }
});
