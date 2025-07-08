import { useState, useEffect, useCallback } from "react";
import { getValue } from "../../../util/secure-store";
import { getAllAccountsWithStoredData } from "../../../util/pin-rotation";
import { PinManagementState, PinModalState } from "../types";

/**
 * Custom hook for managing PIN-related state and operations
 */
export const usePinManagement = () => {
  // Main state
  const [state, setState] = useState<PinManagementState>({
    isLoading: false,
    pinExists: false,
    currentOperation: null,
    oldPin: null,
    accountsWithData: 0,
  });

  // Modal states
  const [modalState, setModalState] = useState<PinModalState>({
    pinModalVisible: false,
    rotatePinModalVisible: false,
    pinCreationVisible: false,
    pinRotationFlowVisible: false,
    showRotationProgress: false,
  });

  // Check if PIN exists on mount
  useEffect(() => {
    checkExistingPin();
    loadAccountsWithData();
  }, []);

  /**
   * Checks if a PIN already exists in secure storage
   */
  const checkExistingPin = useCallback(async () => {
    try {
      const savedPin = await getValue("user_pin");
      setState(prev => ({ ...prev, pinExists: savedPin !== null }));
    } catch (error) {
      console.error("Error checking existing PIN:", error);
    }
  }, []);

  /**
   * Loads the count of accounts with stored encrypted data
   */
  const loadAccountsWithData = useCallback(async () => {
    try {
      const accounts = await getAllAccountsWithStoredData();
      setState(prev => ({ ...prev, accountsWithData: accounts.length }));
    } catch (error) {
      console.error("Error loading accounts with data:", error);
    }
  }, []);

  /**
   * Sets loading state
   */
  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  /**
   * Updates the PIN exists state
   */
  const setPinExists = useCallback((pinExists: boolean) => {
    setState(prev => ({ ...prev, pinExists }));
  }, []);

  /**
   * Sets the current operation
   */
  const setCurrentOperation = useCallback((operation: PinManagementState['currentOperation']) => {
    setState(prev => ({ ...prev, currentOperation: operation }));
  }, []);

  /**
   * Sets the old PIN for rotation
   */
  const setOldPin = useCallback((oldPin: string | null) => {
    setState(prev => ({ ...prev, oldPin }));
  }, []);

  /**
   * Updates modal visibility states
   */
  const updateModalState = useCallback((updates: Partial<PinModalState>) => {
    setModalState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Resets all state to initial values
   */
  const resetState = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentOperation: null,
      oldPin: null,
      isLoading: false,
    }));
    setModalState({
      pinModalVisible: false,
      rotatePinModalVisible: false,
      pinCreationVisible: false,
      pinRotationFlowVisible: false,
      showRotationProgress: false,
    });
  }, []);

  return {
    // State
    ...state,
    ...modalState,
    
    // Actions
    setLoading,
    setPinExists,
    setCurrentOperation,
    setOldPin,
    updateModalState,
    resetState,
    loadAccountsWithData,
    checkExistingPin,
  };
};
