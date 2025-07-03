import { StyleSheet } from "react-native";

// Named color constants - the actual color values
const namedColors = {
  // Grays and neutrals
  darkestGray: "#1a1a1f",
  darkGray: "#25252d",
  mediumDarkGray: "#2c2c36",
  mediumGray: "#444455",
  lightMediumGray: "#8c8c9e",
  lightGray: "#a0a0b0",
  lighterGray: "#c2c2cc",
  lightestGray: "#f0f0f5",

  // Accent colors - Electric Pastel palette (lighter & more electric)
  blue: "#7DD3FC", // Electric sky blue - brighter and more vivid
  green: "#86EFAC", // Electric mint green - glowing pastel
  red: "#FCA5A5", // Electric rose - soft but bright coral

  // Special grays for specific contexts
  expandedGray: "#262935",
  cardBorderGray: "#3a3f55",
  buttonTextDark: "#16161c",

  // Transparent overlays
  darkOverlay: "rgba(15, 15, 20, 0.85)",
  blueOverlay: "rgba(33, 150, 243, 0.1)",
  greenOverlay: "rgba(76, 175, 80, 0.1)",
  redOverlay: "rgba(244, 67, 54, 0.1)",

  // Pure colors for shadows
  black: "#000",
};

// Semantic color mappings - what each color is used for
const colors = {
  // Core app colors
  background: namedColors.darkestGray,
  cardBg: namedColors.darkGray,
  textPrimary: namedColors.lightestGray,
  textSecondary: namedColors.lighterGray,
  border: namedColors.mediumGray,
  inputBg: namedColors.mediumDarkGray,
  disabledBg: namedColors.mediumDarkGray,
  disabledText: namedColors.lightGray,
  modalOverlayBg: namedColors.darkOverlay,
  statusBarBg: namedColors.darkestGray,
  outlineBold: namedColors.lighterGray,
  buttonTextDark: namedColors.buttonTextDark,
  placeholderText: namedColors.lightMediumGray,
  expandedBg: namedColors.expandedGray,
  cardBorder: namedColors.cardBorderGray,

  // Semantic aliases for clarity
  primary: namedColors.blue,
  success: namedColors.green,
  danger: namedColors.red,

  // Light variants for backgrounds
  blueLight: namedColors.blueOverlay,
  greenLight: namedColors.greenOverlay,
  redLight: namedColors.redOverlay,

  // Shadow colors
  shadowColor: namedColors.black,
};

// Export colors so components can use them directly when needed
export { colors, namedColors };

export const styles = StyleSheet.create({
  // LAYOUT & CONTAINER STYLES
  container: {
    padding: 20,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingBottom: 20, // Extra space at bottom for better scroll experience
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

  // AUTH LAYOUT STYLES
  authContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.background,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: colors.textPrimary,
  },
  authText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    color: colors.textSecondary,
  },

  // TYPOGRAPHY STYLES
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: colors.textPrimary,
  },
  profileName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
    letterSpacing: 0.8,
    maxWidth: 200, // Limit width to enable truncation
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    // marginBottom: 8,
    paddingBottom: 8,
    textTransform: "uppercase",
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
    textAlign: "left",
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

  // BUTTON STYLES - All outline only, no filled backgrounds
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 36,
  },
  button: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 3,
    marginHorizontal: 4,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary,
    elevation: 0,
    width: "100%", // Ensure consistent width
  },
  buttonText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 16,
  },
  // Button Variants - consistent outline-only styles
  primaryButton: {
    backgroundColor: "transparent",
    borderColor: colors.primary,
    borderWidth: 2,
  },
  primaryButtonText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderColor: colors.border,
    borderWidth: 2,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontWeight: "700",
    fontSize: 16,
  },
  authButton: {
    backgroundColor: "transparent",
    borderColor: colors.primary,
    borderWidth: 2,
  },
  authButtonText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 16,
  },
  resetButton: {
    backgroundColor: "transparent",
    borderColor: colors.danger,
    borderWidth: 2,
  },
  resetButtonText: {
    color: colors.danger,
    fontWeight: "700",
    fontSize: 16,
  },
  // Legacy button styles (for backward compatibility)
  navButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 1,
    marginVertical: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  navButtonText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.textSecondary,
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
    opacity: 0.6,
  },
  disabledButtonText: {
    color: colors.disabledText,
    fontWeight: "700",
    fontSize: 16,
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
    shadowColor: colors.shadowColor,
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
    backgroundColor: "transparent",
  },
  confirmButton: {
    backgroundColor: "transparent",
    borderColor: colors.primary,
  },
  confirmButtonText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 16,
  },

  // CARD & SECTION STYLES
  section: {
    marginBottom: 28,
    backgroundColor: colors.cardBg,
    borderRadius: 2,
    padding: 18,
    borderColor: colors.outlineBold,
    shadowColor: colors.shadowColor,
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
    borderColor: colors.border,
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
    marginTop: 16,
    gap: 12,
  },
  profileItemSelected: {
    backgroundColor: colors.expandedBg,
    borderColor: colors.primary,
  },
  profileContentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  profileTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  activeProfileBadge: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  activeProfileBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.success,
  },
  profileAccountCountText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  profileNetworkText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },

  // ACCOUNT ITEM STYLES
  accountItemContainer: {
    marginBottom: 10,
  },
  accountItemContainerCompact: {
    marginBottom: 4,
  },
  accountItemActive: {
    borderColor: namedColors.lighterGray,
    borderWidth: 2,
  },
  accessTypeBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  accessTypeBadgeHot: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.success,
  },
  accessTypeBadgeView: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  accessTypeBadgeText: {
    color: colors.textPrimary,
    fontWeight: "bold",
    fontSize: 11,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceRow: {
    flexDirection: "column",
    marginTop: 8,
    gap: 4,
  },
  balanceText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  balancePrimary: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: colors.placeholderText,
    marginTop: 5,
  },
  accountActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 16,
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    margin: 4,
  },
  iconButtonActive: {
    backgroundColor: "transparent",
    borderColor: colors.primary,
    borderWidth: 2,
  },
  iconButtonDestructive: {
    backgroundColor: "transparent",
    borderColor: colors.danger,
    borderWidth: 2,
  },
  accountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  accountInfo: {
    flex: 1,
    marginRight: 12,
  },
  accountNickname: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  activeIndicatorBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: namedColors.lighterGray,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  activeIndicatorText: {
    color: namedColors.lighterGray,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },

  // Compact mode styles
  compactAccountItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  compactBalanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 16,
  },
  compactActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 12,
  },

  // Button spacing variants
  buttonSpacingDefault: {
    marginTop: 20,
  },
  buttonSpacingSmall: {
    marginTop: 10,
  },
  buttonSpacingTight: {
    marginTop: 5,
  },

  // Icon button styles
  menuIconButton: {
    padding: 8, // Reduced padding for closer edge placement
    borderRadius: 8,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    // Remove border for cleaner header look
    borderWidth: 0,
    // Ensure adequate touch target (minimum 44px)
    minWidth: 44,
    minHeight: 44,
    // Add subtle visual feedback
    opacity: 1,
  },

  // Header styles for edge-to-edge layout
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20, // Match containerWithHeader padding for alignment
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: colors.background,
  },

  // Container without top padding for edge-to-edge header
  containerWithHeader: {
    flex: 1, // Allow this to take remaining space
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.background,
  },

  // Fixed footer container for bottom-anchored elements
  bottomTotalsContainer: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    // Add safe area padding for devices with home indicators
    paddingBottom: 20, // This will be overridden by safe area if needed
  },

  // Filter button styles for dev views - outline only
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "transparent",
  },
  filterButtonActive: {
    backgroundColor: "transparent",
    borderColor: colors.primary,
    borderWidth: 2,
  },
  filterButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },

  // View-only account warning styles
  viewOnlyContainer: {
    marginTop: 16,
  },
  viewOnlyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  viewOnlyIcon: {
    marginLeft: 8,
    color: colors.danger,
  },

  // Transaction history styles
  sectionContainer: {
    marginBottom: 24,
  },
  transactionsList: {
    flex: 1,
  },
  listItem: {
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  transactionHash: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
    fontFamily: "monospace",
  },
  transactionStatus: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  transactionDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 8,
  },
  transactionDetailText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
    fontFamily: "monospace",
  },
  transactionStatusContainer: {
    alignItems: "flex-end",
  },
  vmStatusText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: "monospace",
    marginTop: 2,
  },
  argumentsContainer: {
    marginTop: 8,
    paddingTop: 0,
  },
  argumentText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 8,
    marginBottom: 2,
    fontFamily: "monospace",
  },
  transactionDate: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },
  failureContainer: {
    alignItems: "flex-end",
  },
  functionSection: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: "center",
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
  },
  retryText: {
    fontSize: 16,
    color: colors.primary,
    marginTop: 8,
    textAlign: "center",
    textDecorationLine: "underline",
  },

  // Account switching feedback styles
  switchingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginBottom: 12,
  },
  switchingActivityIndicator: {
    marginRight: 8,
  },
  switchingText: {
    textAlign: "center",
    color: colors.primary,
  },
});
