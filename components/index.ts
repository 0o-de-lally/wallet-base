// Auth system exports
export { SetupGuard } from "./auth/SetupGuard";
export { useSetupGuard } from "../hooks/use-setup-guard";
export type { SetupStatus } from "../hooks/use-setup-guard";

// Onboarding exports
export { OnboardingWizard } from "./onboarding/OnboardingWizard";
export {
  WelcomeStep,
  AccountChoiceStep,
  AccountSetupStep,
  CompleteStep,
} from "./onboarding";
