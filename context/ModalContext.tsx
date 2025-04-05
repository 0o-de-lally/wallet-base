import React, { createContext, useState, useContext, ReactNode } from "react";
import ConfirmationModal from "../components/modal/ConfirmationModal";

type ModalContextType = {
  showAlert: (title: string, message: string, callback?: () => void) => void;
  showConfirmation: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    isDestructive?: boolean
  ) => void;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider = ({ children }: ModalProviderProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalConfirmText, setModalConfirmText] = useState("OK");
  const [modalCallback, setModalCallback] = useState<(() => void) | null>(null);
  const [isConfirmation, setIsConfirmation] = useState(false);
  const [isDestructive, setIsDestructive] = useState(false);

  const showAlert = (title: string, message: string, callback?: () => void) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalConfirmText("OK");
    setModalCallback(() => callback || null);
    setIsConfirmation(false);
    setIsDestructive(false);
    setModalVisible(true);
  };

  const showConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = "Confirm",
    isDestructive = false
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalConfirmText(confirmText);
    setModalCallback(() => onConfirm);
    setIsConfirmation(true);
    setIsDestructive(isDestructive);
    setModalVisible(true);
  };

  const handleConfirm = () => {
    setModalVisible(false);
    if (modalCallback) {
      modalCallback();
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirmation }}>
      {children}
      <ConfirmationModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        confirmText={modalConfirmText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isDestructive={isDestructive}
      />
    </ModalContext.Provider>
  );
};
