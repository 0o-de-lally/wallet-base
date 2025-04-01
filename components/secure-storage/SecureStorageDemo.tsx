import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { SecureStorageForm } from "./SecureStorageForm";
import { saveValue, getValue, deleteValue, clearAllSecureStorage } from "../../util/secure_store";
import { Link } from "expo-router";

// The key used for demo storage
const STORAGE_KEY = "secure_demo_value";

export function SecureStorageDemo() {
  const [value, setValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [hasPinSetup, setHasPinSetup] = useState<boolean>(false);

  // Check if PIN is set up
  useEffect(() => {
    const checkPinSetup = async () => {
      try {
        const savedPin = await getValue("user_pin");
        setHasPinSetup(savedPin !== null);

        if (!savedPin) {
          setStatusMessage("Please set up a PIN in the PIN Management screen first");
        }
      } catch (error) {
        console.error("Error checking PIN setup:", error);
      }
    };

    checkPinSetup();
  }, []);

  const handleSave = async () => {
    if (!value.trim()) {
      setStatusMessage("Please enter a value to save");
      return;
    }

    setIsLoading(true);
    setStatusMessage("Saving...");

    try {
      await saveValue(STORAGE_KEY, value);
      setStatusMessage("Value saved successfully!");
    } catch (error) {
      console.error("Error saving value:", error);
      setStatusMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetrieve = async () => {
    setIsLoading(true);
    setStatusMessage("Retrieving...");

    try {
      const retrievedValue = await getValue(STORAGE_KEY);
      if (retrievedValue) {
        setValue(retrievedValue);
        setStatusMessage("Value retrieved successfully!");
      } else {
        setStatusMessage("No value found in secure storage");
      }
    } catch (error) {
      console.error("Error retrieving value:", error);
      setStatusMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setStatusMessage("Deleting...");

    try {
      await deleteValue(STORAGE_KEY);
      setValue("");
      setStatusMessage("Value deleted successfully!");
    } catch (error) {
      console.error("Error deleting value:", error);
      setStatusMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    setIsLoading(true);
    setStatusMessage("Clearing all secure storage...");

    try {
      await clearAllSecureStorage();
      setValue("");
      setStatusMessage("All secure storage cleared successfully!");
    } catch (error) {
      console.error("Error clearing secure storage:", error);
      setStatusMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={demoStyles.container}>
      <Text style={demoStyles.title}>Secure Storage Demo</Text>

      {!hasPinSetup && (
        <View style={demoStyles.warningBox}>
          <Text style={demoStyles.warningText}>
            PIN is not set up. Please set up a PIN first.
          </Text>
          <Link href="/pin" style={demoStyles.linkText}>
            Go to PIN Management
          </Link>
        </View>
      )}

      <SecureStorageForm
        value={value}
        onValueChange={setValue}
        onSave={handleSave}
        onRetrieve={handleRetrieve}
        onDelete={handleDelete}
        onClearAll={handleClearAll}
        isLoading={isLoading}
        disabled={!hasPinSetup}
      />

      {isLoading && <ActivityIndicator style={demoStyles.loader} />}

      {statusMessage ? (
        <Text style={demoStyles.statusText}>{statusMessage}</Text>
      ) : null}
    </View>
  );
}

const demoStyles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  loader: {
    marginTop: 20,
  },
  statusText: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
    textAlign: "center",
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginBottom: 16,
  },
  warningText: {
    color: '#856404',
    marginBottom: 8,
  },
  linkText: {
    color: '#007bff',
    fontWeight: 'bold',
  },
});
