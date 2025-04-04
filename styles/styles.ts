import { StyleSheet } from "react-native";

// Improved subdued dark mode color palette with better contrast
const colors = {
  background: "#1a1a1f",
  cardBg: "#25252d",
  primary: "#94c2f3", // Pastel blue
  secondary: "#b3b8c3", // Pastel gray
  success: "#a5d6b7", // Pastel green
  danger: "#f5a9a9", // Pastel red
  textPrimary: "#f0f0f5",
  textSecondary: "#c2c2cc",
  border: "#444455",
  inputBg: "#2c2c36",
  disabledBg: "#2c2c36",
  disabledText: "#a0a0b0", // Lightened for better contrast
  modalOverlayBg: "rgba(15, 15, 20, 0.85)",
  statusBarBg: "#1a1a1f",
  outlineBold: "#c2c2cc",
  buttonTextDark: "#16161c", // Darker text for buttons for better contrast
  placeholderText: "#8c8c9e", // New color for placeholder text with better visibility
};

export const styles = StyleSheet.create({
  // Ensure consistent background colors throughout the app
  container: {
    padding: 20,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.background,
  },
  content: {
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: colors.textPrimary,
  },
  inputContainer: {
    marginBottom: 22,
  },
  label: {
    fontSize: 15,
    marginBottom: 8,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.outlineBold,
    backgroundColor: colors.inputBg,
    borderRadius: 3,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  // Add styles for placeholder text
  inputPlaceholder: {
    color: colors.placeholderText,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 36,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 3,
    marginHorizontal: 4,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary,
    elevation: 0,
  },
  buttonText: {
    color: colors.buttonTextDark, // Darker text on pastel buttons for better contrast
    fontWeight: "700",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  cancelButtonText: {
    color: colors.secondary, // Already high contrast
    fontWeight: "700",
    fontSize: 16,
  },
  resultContainer: {
    backgroundColor: colors.cardBg,
    padding: 18,
    borderRadius: 3,
    marginTop: 24,
    borderWidth: 2,
    borderColor: colors.outlineBold,
  },
  resultLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: colors.textSecondary,
  },
  resultValue: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "500", // Added weight for better readability
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
    color: colors.textSecondary,
    lineHeight: 20,
  },
  // Danger zone section
  dangerZone: {
    marginTop: 36,
    paddingTop: 28,
    borderTopWidth: 2,
    borderTopColor: colors.outlineBold,
    alignItems: "center",
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.danger,
    marginBottom: 12,
  },
  dangerButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.danger,
  },
  // Add specific text styling for danger buttons
  dangerButtonText: {
    color: colors.danger,
    fontWeight: "700",
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: colors.disabledBg,
    color: colors.textSecondary, // Now using higher contrast disabled text color
    borderColor: colors.border,
    borderWidth: 2,
  },
  disabledButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.disabledText,
    opacity: 0.8, // Increased from 0.7 for better visibility
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlayBg,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.cardBg,
    borderRadius: 5,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    borderWidth: 2,
    borderColor: colors.outlineBold,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
    color: colors.textSecondary,
  },
  pinInput: {
    borderWidth: 2,
    borderColor: colors.outlineBold,
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: "center",
    letterSpacing: 8,
    color: colors.textPrimary,
  },
  errorText: {
    color: colors.danger,
    marginTop: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 3,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
    borderWidth: 2,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  // PIN Screen styles
  section: {
    marginBottom: 28,
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    padding: 18,
    borderWidth: 2,
    borderColor: colors.outlineBold,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: colors.textPrimary,
  },

  // App styles
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 1,
    marginVertical: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  navButtonText: {
    color: colors.buttonTextDark, // Using the same dark color for consistent button text
    fontWeight: "700",
    fontSize: 16,
  },

  // Add explicit styling for any potential containers that might be using default colors
  safeAreaView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    backgroundColor: colors.background,
  },
  footerContainer: {
    backgroundColor: colors.background,
  },

  // Add status bar specific styling for consistency
  statusBar: {
    backgroundColor: colors.statusBarBg,
  },
});
