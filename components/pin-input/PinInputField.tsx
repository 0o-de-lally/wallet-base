import React, { memo, forwardRef, useState } from "react";
import { TextInputProps, TextInput, View, TouchableOpacity, Text } from "react-native";
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
        <View style={{ width: "100%" }}>
          <Text style={{ fontSize: 14, fontWeight: "500", marginBottom: 4 }}>
            {label}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: "#444", borderRadius: 6, color: "#fff" }}
              value={value}
              onChangeText={handleChangeText}
              placeholder={placeholder}
              placeholderTextColor="#888"
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
              style={{ marginLeft: 8, padding: 8 }}
              onPress={() => setHidden((h) => !h)}
              accessibilityRole="button"
              accessibilityLabel={hidden ? "Show password" : "Hide password"}
            >
              <Text style={{ color: "#4da3ff", fontSize: 12 }}>
                {hidden ? "show" : "hide"}
              </Text>
            </TouchableOpacity>
          </View>
          {error ? (
            <Text style={{ color: "#ff6b6b", marginTop: 4, fontSize: 12 }}>
              {error}
            </Text>
          ) : null}
        </View>
      );
    },
  ),
);

PinInputField.displayName = "PinInputField";
