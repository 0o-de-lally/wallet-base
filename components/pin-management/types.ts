type PinOperation = "verify" | "rotate" | "create" | null;

export interface PinManagementState {
  isLoading: boolean;
  pinExists: boolean;
  currentOperation: PinOperation;
  oldPin: string | null;
  accountsWithData: number;
}

export interface PinModalState {
  pinModalVisible: boolean;
  rotatePinModalVisible: boolean;
  pinCreationVisible: boolean;
  pinRotationFlowVisible: boolean;
  showRotationProgress: boolean;
}
