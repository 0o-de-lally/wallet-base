import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList } from "react-native";
import { styles, colors } from "../../styles/styles";
import { ActionButton } from "./ActionButton";

interface DropdownProps<T> {
  label: string;
  value: T;
  options: T[];
  onSelect: (value: T) => void;
  placeholder?: string;
  renderLabel?: (item: T) => string;
}

function Dropdown<T>({
  label,
  value,
  options,
  onSelect,
  placeholder = "Select an option",
  renderLabel = (item: T) => String(item),
}: DropdownProps<T>) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedValue, setSelectedValue] = useState<T | null>(value || null);

  // Update internal state when external value changes
  useEffect(() => {
    setSelectedValue(value || null);
  }, [value]);

  const displayValue = selectedValue ? renderLabel(selectedValue) : placeholder;

  const handleSelect = (item: T) => {
    setSelectedValue(item);
    onSelect(item);
    setShowDropdown(false);
    console.log("Dropdown selected:", renderLabel(item));
  };

  const renderItem = ({ item }: { item: T }) => (
    <TouchableOpacity
      style={[
        styles.resultContainer,
        { marginVertical: 4, padding: 12 },
        value === item && { backgroundColor: colors.expandedBg },
      ]}
      onPress={() => handleSelect(item)}
      accessible={true}
      accessibilityRole="menuitem"
      accessibilityLabel={`Select ${renderLabel(item)}`}
    >
      <Text style={styles.resultValue}>{renderLabel(item)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, { paddingVertical: 12, paddingHorizontal: 10 }]}
        onPress={() => setShowDropdown(true)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Select ${label.toLowerCase()}, current value: ${displayValue}`}
      >
        <Text style={{ color: styles.resultValue.color }}>{displayValue}</Text>
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
        accessible={true}
        accessibilityViewIsModal={true}
        accessibilityLabel={`Select ${label.toLowerCase()}`}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: "80%" }]}>
            <Text style={styles.modalTitle}>{`Select ${label}`}</Text>
            <FlatList
              data={options}
              renderItem={renderItem}
              keyExtractor={(item) => renderLabel(item)}
              style={{ maxHeight: 300 }}
              accessible={true}
              accessibilityRole="menu"
            />
            <ActionButton
              text="Close"
              onPress={() => setShowDropdown(false)}
              style={{ marginTop: 15 }}
              accessibilityLabel="Close selection"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default Dropdown;
