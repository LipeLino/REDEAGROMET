"use client";

import { useState } from "react";
import { LoginModal } from "./LoginModal";
import { RegisterModal } from "./RegisterModal";

export function AuthModals() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // This function should close register and open login
  const handleSwitchToLogin = () => {
    setIsRegisterOpen(false); // Close register modal
    setIsLoginOpen(true);     // Open login modal
  };

  return {
    loginTrigger: () => setIsLoginOpen(true),
    registerTrigger: () => setIsRegisterOpen(true),
    modals: (
      <>
        <LoginModal 
          isOpen={isLoginOpen} 
          onClose={() => setIsLoginOpen(false)} 
        />
        <RegisterModal 
          isOpen={isRegisterOpen} 
          onClose={() => setIsRegisterOpen(false)} 
          onSwitchToLogin={handleSwitchToLogin} // <- This is the key
        />
      </>
    )
  };
}