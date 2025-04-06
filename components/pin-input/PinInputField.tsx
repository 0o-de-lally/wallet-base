import React, { memo, forwardRef } from "react";
import { TextInputProps, TextInput } from "react-native";
import { FormInput } from "../common/FormInput";

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
        placeholder = "Enter PIN",
        error,
        maxLength = 6,
        autoFocus = false,
        onSubmit,
        clearOnSubmit = false,
        ...rest
      },
      ref,
    ) => {
      const handleChangeText = (text: string) => {
        // Only allow numeric input
        if (/^\d*$/.test(text)) {
          onChangeText(text);
        }
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

      return (
        <FormInput
          label={label}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          error={error}
          keyboardType="number-pad"
          secureTextEntry={true}
          maxLength={maxLength}
          autoFocus={autoFocus}
          onSubmitEditing={handleSubmitEditing}
          ref={ref}
          {...rest}
        />
      );
    },
  ),
);

PinInputField.displayName = "PinInputField";
