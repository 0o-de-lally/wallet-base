import { AccountAddress } from "open-libra-sdk";

export type AccountMode = "recover" | "generate";

export interface RecoveryState {
  mode: AccountMode;
  mnemonic: string;
  nickname: string;
  error: string | null;
  isLoading: boolean;
  isVerifiedMnemonic: boolean;
  derivedAddress: AccountAddress | null;
  isChainVerified: boolean;
  chainAddress: AccountAddress | null;
  isVerifyingChain: boolean;
  isDeriving: boolean;
  selectedProfile: string;
  successModalVisible: boolean;
  saveInitiated: boolean;
  accountCreated: boolean;
  createdAccountId: string | null;
}

export interface RecoveryActions {
  setMode: (mode: AccountMode) => void;
  setMnemonic: (mnemonic: string) => void;
  setNickname: (nickname: string) => void;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsVerifiedMnemonic: (verified: boolean) => void;
  setDerivedAddress: (address: AccountAddress | null) => void;
  setIsChainVerified: (verified: boolean) => void;
  setChainAddress: (address: AccountAddress | null) => void;
  setIsVerifyingChain: (verifying: boolean) => void;
  setIsDeriving: (deriving: boolean) => void;
  setSelectedProfile: (profile: string) => void;
  setSuccessModalVisible: (visible: boolean) => void;
  setSaveInitiated: (initiated: boolean) => void;
  setAccountCreated: (created: boolean) => void;
  setCreatedAccountId: (id: string | null) => void;
}

export interface RecoverAccountFormProps {
  profileName?: string;
  onComplete: () => void;
  onResetForm?: () => void;
}
