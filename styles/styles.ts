import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF", // Ensuring white text for better contrast
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#f2f2f2",
  },
  cancelButtonText: {
    color: "#000000",
    fontWeight: "bold",
    fontSize: 16,
  },
  resultContainer: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 16,
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
    color: "#666",
    lineHeight: 20,
  },
  // Danger zone section
  dangerZone: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    alignItems: "center",
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#d32f2f",
    marginBottom: 10,
  },
  dangerButton: {
    backgroundColor: "#d32f2f",
    borderColor: "#b71c1c",
  },
  disabledInput: {
    backgroundColor: "#f5f5f5",
    color: "#999",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
    opacity: 0.7,
  },

  // Modal styles (from PinInputModal)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
    color: "#666",
  },
  pinInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: "center",
    letterSpacing: 8,
  },
  errorText: {
    color: "red",
    marginTop: 10,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#007AFF",
  },

  // PIN Screen styles (from pin.tsx)
  section: {
    marginBottom: 30,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },

  // App styles (from index.tsx)
  root: {
    flex: 1,
  },
  navButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: "center",
  },
  navButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
