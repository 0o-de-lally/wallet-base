import React, { memo, forwardRef, useState } from "react";
import {
  TextInputProps,
  TextInput,
  View,
  TouchableOpacity,
  Text,
} from "react-native";
import { FormInput } from "../common/FormInput";
import { useAuthenticationProtection } from "../../hooks/use-screenshot-protection";
import { styles } from "../../styles/styles";

interface PinInputFieldProps extends Omit<TextInputProps, "onChangeText"> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  maxLength?: number;
  autoFocus?: boolean;
  onSubmit?: () => void;
  clearOnSubmit?: boolean;
  showToggle?: boolean; // show eye icon / toggle for password
}

/**
 * A simplified input field for PIN entry
 */
export const PinInputField = memo(
  forwardRef<TextInput, PinInputFieldProps>(
    (
      {
        label,
        value,
        onChangeText,
        placeholder = "enter password",
        error,
        maxLength = 128,
        autoFocus = false,
        onSubmit,
        clearOnSubmit = false,
        showToggle = false,
        ...rest
      },
      ref,
    ) => {
      // Authentication protection - prevents screenshots during PIN entry
      useAuthenticationProtection("PinInputField");

      const [hidden, setHidden] = useState(true);
      const handleChangeText = (text: string) => {
        onChangeText(text);
      };

      const handleSubmitEditing = () => {
        if (onSubmit) {
          onSubmit();

          // Clear PIN after submission if requested
          if (clearOnSubmit) {
            onChangeText("");
          }
        }
      };

      if (!showToggle) {
        return (
          <FormInput
            label={label}
            value={value}
            onChangeText={handleChangeText}
            placeholder={placeholder}
            error={error}
            keyboardType={"default"}
            secureTextEntry={hidden}
            maxLength={maxLength}
            autoFocus={autoFocus}
            onSubmitEditing={handleSubmitEditing}
            ref={ref}
            autoCapitalize="none"
            autoCorrect={false}
            {...rest}
          />
        );
      }

      // Custom inline layout to show toggle; replicate FormInput structure
      return (
        <View style={styles.passwordInputContainer}>
          <Text style={styles.passwordInputLabel}>{label}</Text>
          <View style={styles.passwordInputRow}>
            <TextInput
              style={styles.passwordInput}
              value={value}
              onChangeText={handleChangeText}
              placeholder={placeholder}
              placeholderTextColor={styles.inputPlaceholder.color}
              secureTextEntry={hidden}
              keyboardType={"default"}
              maxLength={maxLength}
              autoFocus={autoFocus}
              onSubmitEditing={handleSubmitEditing}
              autoCapitalize="none"
              autoCorrect={false}
              ref={ref}
              {...rest}
            />
            <TouchableOpacity
              style={styles.passwordToggleButton}
              onPress={() => setHidden((h) => !h)}
              accessibilityRole="button"
              accessibilityLabel={hidden ? "Show password" : "Hide password"}
            >
              <Text style={styles.passwordToggleText}>
                {hidden ? "show" : "hide"}
              </Text>
            </TouchableOpacity>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      );
    },
  ),
);

PinInputField.displayName = "PinInputField";
