"use client";

import React, { useState, createContext, useContext, ReactNode } from "react";
import { CustomNotification, NotificationType } from "@/components/ui/custom-notification";

export interface NotificationState {
  type: NotificationType;
  message: string;
  isVisible: boolean;
  lastRefreshTime?: Date;
}

interface NotificationContextType {
  notification: NotificationState;
  showNotification: (type: NotificationType, message: string, lastRefreshTime?: Date) => void;
  hideNotification: () => void;
  clearNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<NotificationState>({
    type: "info",
    message: "",
    isVisible: false,
  });

  const showNotification = (type: NotificationType, message: string, lastRefreshTime?: Date) => {
    setNotification({ type, message, isVisible: true, lastRefreshTime });
  };

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, isVisible: false }));
  };

  const clearNotification = () => {
    setNotification({ type: "info", message: "", isVisible: false });
  };

  return (
    <NotificationContext.Provider
      value={{
        notification,
        showNotification,
        hideNotification,
        clearNotification,
      }}
    >
      {children}
      {notification.isVisible && (
        <CustomNotification
          type={notification.type}
          message={notification.message}
          isVisible={notification.isVisible}
          onClose={hideNotification}
          duration={5000}
          lastRefreshTime={notification.lastRefreshTime}
        />
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}
