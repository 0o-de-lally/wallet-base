import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocalAuth } from "../hooks/use-local-auth";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  authenticate: () => Promise<boolean>;
  authAvailable: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authenticate, isLoading, authAvailable } =
    useLocalAuth();
  const [initialAuthChecked, setInitialAuthChecked] = useState(false);

  // Attempt authentication on first load
  useEffect(() => {
    if (!initialAuthChecked && !isLoading) {
      authenticate().then(() => {
        setInitialAuthChecked(true);
      });
    }
  }, [authenticate, initialAuthChecked, isLoading]);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, authenticate, isLoading, authAvailable }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
