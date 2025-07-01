// Auth system exports
export { SetupGuard } from "./auth/SetupGuard";
export { AuthenticationView } from "./auth/AuthenticationView";
export { useSetupGuard } from "../hooks/use-setup-guard";
export type { SetupStatus } from "../hooks/use-setup-guard";

// Common components
export { Identicon } from "./common/Identicon";

// Onboarding exports
export { OnboardingWizard } from "./onboarding/OnboardingWizard";
export {
  WelcomeStep,
  AccountChoiceStep,
  AccountSetupStep,
  CompleteStep,
} from "./onboarding";

// Transaction components
export { HistoricalTransactions } from "./transaction/HistoricalTransactions";
// Profile components
export { AccountStateStatus } from "./profile/AccountStateStatus";
// Transaction exports
export { TransactionHub } from "./transaction/TransactionHub";
