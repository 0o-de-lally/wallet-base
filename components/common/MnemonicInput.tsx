import React, { memo, useState, useCallback, useEffect } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles, colors } from "../../styles/styles";
import { validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { ActionButton } from "./ActionButton";

interface MnemonicInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onValidationChange?: (isValid: boolean, isVerified: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  showWordCount?: boolean;
  autoValidate?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  wordCount: number;
}

const checkValidMnem = (mnemonic: string): ValidationResult => {
  const trimmed = mnemonic.trim();
  const words = trimmed ? trimmed.split(/\s+/) : [];
  const wordCount = words.length;

  // Basic checks first
  if (wordCount === 0) {
    return { isValid: false, wordCount: 0 };
  }

  // Check for valid word count (BIP39 supports 12, 15, 18, 21, 24 words)
  const validWordCounts = [12, 15, 18, 21, 24];
  if (!validWordCounts.includes(wordCount)) {
    return {
      isValid: false,
      error: `Invalid word count: ${wordCount}. Must be 12, 15, 18, 21, or 24 words.`,
      wordCount,
    };
  }

  // Check for basic word format (no numbers, special characters except spaces)
  const invalidWords = words.filter(
    (word) => !/^[a-zA-Z]+$/.test(word) || word.length < 2,
  );

  if (invalidWords.length > 0) {
    return {
      isValid: false,
      error: `Invalid words detected: ${invalidWords.slice(0, 3).join(", ")}${invalidWords.length > 3 ? "..." : ""}`,
      wordCount,
    };
  }

  // For complete mnemonics (24 words), validate with @scure/bip39 (fast and lightweight)
  if (wordCount === 24) {
    try {
      // Use @scure/bip39 for instant validation instead of LibraWallet.fromMnemonic()
      const isValidMnemonic = validateMnemonic(trimmed, wordlist);
      if (!isValidMnemonic) {
        return {
          isValid: false,
          error: "Invalid mnemonic: checksum validation failed",
          wordCount,
        };
      }
      return { isValid: true, wordCount };
    } catch {
      return {
        isValid: false,
        error: "Invalid mnemonic: validation error",
        wordCount,
      };
    }
  }

  // For incomplete mnemonics, consider them potentially valid
  return { isValid: true, wordCount };
};

export const MnemonicInput = memo(
  ({
    label,
    value,
    onChangeText,
    onValidationChange,
    placeholder = "Enter your 24-word recovery phrase...",
    disabled = false,
    showWordCount = true,
    autoValidate = true,
  }: MnemonicInputProps) => {
    const [validation, setValidation] = useState<ValidationResult>({
      isValid: false,
      wordCount: 0,
    });
    const [isFocused, setIsFocused] = useState(false);

    const handleTextChange = useCallback(
      (text: string) => {
        onChangeText(text);

        if (autoValidate) {
          const validationResult = checkValidMnem(text);
          setValidation(validationResult);

          // For complete, valid mnemonics, validation includes full verification
          const isVerified =
            validationResult.isValid && validationResult.wordCount === 24;
          onValidationChange?.(validationResult.isValid, isVerified);
        }
      },
      [onChangeText, onValidationChange, autoValidate],
    );

    const handleClear = useCallback(() => {
      onChangeText("");
      setValidation({ isValid: false, wordCount: 0 });
      onValidationChange?.(false, false);
    }, [onChangeText, onValidationChange]);

    // Update validation when value changes externally
    useEffect(() => {
      if (autoValidate) {
        const validationResult = checkValidMnem(value);
        setValidation(validationResult);

        // For complete, valid mnemonics, validation includes full verification
        const isVerified =
          validationResult.isValid && validationResult.wordCount === 24;
        onValidationChange?.(validationResult.isValid, isVerified);
      }
    }, [value, autoValidate, onValidationChange]);

    const getStatusColor = () => {
      if (!value.trim()) return styles.label.color;
      if (validation.wordCount === 24 && validation.isValid) return "#4CAF50"; // Green for verified
      if (validation.error) return "#F44336"; // Red for validation error
      if (validation.wordCount > 0) return "#FF9800"; // Orange for incomplete
      return styles.label.color;
    };

    const getStatusText = () => {
      if (!showWordCount && !validation.error) return null;

      let status = "";
      if (showWordCount) {
        status = `${validation.wordCount}/24 words`;
      }

      if (validation.error) {
        status = validation.error;
      } else if (validation.wordCount === 24 && validation.isValid) {
        status += " Valid";
      } else if (validation.wordCount > 0 && validation.wordCount < 24) {
        status += " (incomplete)";
      }

      return status;
    };

    const renderStatusText = () => {
      const statusText = getStatusText();
      if (!statusText) return null;

      const isValid = validation.wordCount === 24 && validation.isValid;
      
      return (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {isValid && (
            <Ionicons 
              name="checkmark-circle" 
              size={14} 
              color={colors.green} 
              style={{ marginRight: 4 }}
            />
          )}
          <Text
            style={[mnemonicStyles.statusText, { color: getStatusColor() }]}
          >
            {statusText}
          </Text>
        </View>
      );
    };

    const canClear = value.trim().length > 0 && !disabled;

    return (
      <View style={styles.inputContainer}>
        <View style={mnemonicStyles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {renderStatusText()}
        </View>

        <TextInput
          style={[
            styles.input,
            mnemonicStyles.mnemonicInput,
            disabled && styles.disabledInput,
            isFocused && mnemonicStyles.focusedInput,
            validation.error && mnemonicStyles.errorInput,
            validation.wordCount === 24 &&
              validation.isValid &&
              mnemonicStyles.validInput,
          ]}
          value={value}
          onChangeText={handleTextChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={styles.inputPlaceholder.color}
          editable={!disabled}
          multiline={true}
          numberOfLines={6}
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          accessible={true}
          accessibilityLabel={label}
          accessibilityHint={placeholder}
          accessibilityValue={{
            text: `${validation.wordCount} words entered, ${validation.isValid && validation.wordCount === 24 ? "valid" : "invalid"} mnemonic`,
          }}
        />

        <View style={mnemonicStyles.buttonContainer}>
          <ActionButton
            text="Clear"
            onPress={handleClear}
            disabled={!canClear}
            isDestructive={true}
            size="small"
            style={mnemonicStyles.actionButton}
            accessibilityLabel="Clear mnemonic phrase"
            accessibilityHint="Clear all entered text"
          />
        </View>
      </View>
    );
  },
);

const mnemonicStyles = StyleSheet.create({
  labelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  mnemonicInput: {
    minHeight: 140,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: "monospace", // Better for mnemonic words
  },
  focusedInput: {
    borderColor: colors.blue,
    borderWidth: 2,
  },
  errorInput: {
    borderColor: colors.red,
    borderWidth: 1,
  },
  validInput: {
    borderColor: colors.green,
    borderWidth: 1,
  },
  verifiedInput: {
    borderColor: colors.green,
    borderWidth: 2,
  },
  verifyingInput: {
    borderColor: colors.blue,
    borderWidth: 2,
  },
  readyToVerifyInput: {
    borderColor: colors.red,
    borderWidth: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});

MnemonicInput.displayName = "MnemonicInput";
