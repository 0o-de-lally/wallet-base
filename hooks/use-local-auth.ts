import { useState, useCallback, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { useModal } from '../context/ModalContext';

export function useLocalAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authAvailable, setAuthAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { showAlert } = useModal();

  // Check if device has biometric authentication available
  const checkAuthAvailability = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setAuthAvailable(hasHardware && isEnrolled);
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Error checking authentication availability:', error);
      setAuthAvailable(false);
      return false;
    }
  }, []);

  // Authenticate the user
  const authenticate = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check for auth availability first
      const available = await checkAuthAvailability();

      if (!available) {
        console.warn('Biometric authentication is not available on this device');
        // If biometrics aren't available, we'll consider the user "authenticated"
        // This is a fallback for devices without biometric capabilities
        setIsAuthenticated(true);
        return true;
      }

      const authTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const promptMessage = Platform.select({
        ios: 'Authenticate to access your wallet',
        android: 'Authenticate to access your wallet',
        default: 'Authenticate to access your wallet',
      });

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      setIsAuthenticated(result.success);
      return result.success;
    } catch (error) {
      console.error('Authentication error:', error);
      showAlert('Authentication Error', 'Failed to authenticate. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [checkAuthAvailability, showAlert]);

  // Initialize: check if biometric auth is available on this device
  useEffect(() => {
    checkAuthAvailability().finally(() => setIsLoading(false));
  }, [checkAuthAvailability]);

  return {
    isAuthenticated,
    authAvailable,
    authenticate,
    isLoading,
  };
}
