import React, { memo, forwardRef } from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";
import { styles } from "../../styles/styles";

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  disabled?: boolean;
}

export const FormInput = memo(
  forwardRef<TextInput, FormInputProps>(
    (
      {
        label,
        value,
        onChangeText,
        placeholder,
        error,
        disabled = false,
        keyboardType,
        secureTextEntry,
        multiline,
        numberOfLines,
        maxLength,
        ...rest
      },
      ref,
    ) => {
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={[styles.input, disabled && styles.disabledInput]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={styles.inputPlaceholder.color}
            editable={!disabled}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
            multiline={multiline}
            numberOfLines={numberOfLines}
            maxLength={maxLength}
            accessible={true}
            accessibilityLabel={label}
            accessibilityHint={placeholder}
            ref={ref}
            {...rest}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      );
    },
  ),
);

FormInput.displayName = "FormInput";
