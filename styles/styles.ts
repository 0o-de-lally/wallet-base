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
  expandedBg: "#262935",
  cardBorder: "#3a3f55",
};

// Export colors so components can use them directly when needed
export { colors };

export const styles = StyleSheet.create({
  // LAYOUT & CONTAINER STYLES
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
  statusBar: {
    backgroundColor: colors.statusBarBg,
  },
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // TYPOGRAPHY STYLES
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    marginBottom: 8,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
    color: colors.textSecondary,
    lineHeight: 20,
  },
  errorText: {
    color: colors.danger,
    marginTop: 12,
    textAlign: "center",
    fontWeight: "600",
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
    fontWeight: "500",
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.danger,
    marginBottom: 12,
  },

  // INPUT STYLES
  inputContainer: {
    marginBottom: 22,
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
  inputPlaceholder: {
    color: colors.placeholderText,
  },
  disabledInput: {
    backgroundColor: colors.disabledBg,
    color: colors.textSecondary,
    borderColor: colors.border,
    borderWidth: 2,
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

  // BUTTON STYLES
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
    color: colors.buttonTextDark,
    fontWeight: "700",
    fontSize: 16,
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
    color: colors.buttonTextDark,
    fontWeight: "700",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  cancelButtonText: {
    color: colors.secondary,
    fontWeight: "700",
    fontSize: 16,
  },
  dangerButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.danger,
  },
  dangerButtonText: {
    color: colors.danger,
    fontWeight: "700",
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.disabledText,
    color: colors.secondary,
    opacity: 0.8,
  },
  toggleButton: {
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.cardBorder,
    borderRadius: 4,
  },
  toggleText: {
    color: colors.textPrimary,
    fontSize: 13,
  },

  // MODAL STYLES
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

  // CARD & SECTION STYLES
  section: {
    marginBottom: 28,
    backgroundColor: colors.cardBg,
    borderRadius: 2,
    padding: 18,
    borderColor: colors.outlineBold,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  resultContainer: {
    backgroundColor: colors.cardBg,
    padding: 18,
    borderRadius: 3,
    marginTop: 24,
    borderWidth: 2,
    borderColor: colors.outlineBold,
  },
  dangerZone: {
    marginTop: 36,
    paddingTop: 28,
    borderTopWidth: 2,
    borderTopColor: colors.outlineBold,
    alignItems: "center",
  },
  expandedContent: {
    padding: 12,
    backgroundColor: colors.expandedBg,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },

  // PROFILE & ACCOUNT STYLES
  profileItem: {
    padding: 10,
    marginTop: 5,
    borderRadius: 1,
    borderWidth: 1,
    borderColor: colors.outlineBold,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  accountCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  networkInfo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  accountListContainer: {
    paddingLeft: 10,
    paddingBottom: 10,
  },
  radioButton: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioButtonActive: {
    borderColor: colors.primary,
  },
  profileHeader: {
    marginBottom: 10,
  },
  profileHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  profileTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioContainer: {
    marginRight: 8,
  },
  accountItem: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5,
    paddingLeft: 10,
  },
  noAccounts: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  actionButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 8,
  },
});
