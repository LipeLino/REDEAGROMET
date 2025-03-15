"use client";

import { Button } from "@/components/ui/button";
import { LogIn, Menu, X } from "lucide-react";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { AuthModals } from "@/components/auth/AuthModals";
import Image from "next/image";
import { useState } from "react";

export function Header() {
  const isVisible = useScrollHeader();
  const router = useRouter();
  const { loginTrigger, registerTrigger, modals } = AuthModals();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 transition-all duration-300 transform",
          "shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1),0_8px_32px_-4px_rgba(0,0,0,0.1)]",
          "border-b border-gray-100",
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo Section */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* UEMG logo */}
              <div className="relative w-28 sm:w-36 md:w-40 h-10 sm:h-14 md:h-16">
                <Image
                  src="/images/uemg-logo.png"
                  alt="Logo UEMG"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, 160px"
                />
              </div>
              
              {/* FAPEMIG logo */}
              <div className="relative w-20 sm:w-28 md:w-32 h-8 sm:h-10 md:h-12">
                <Image
                  src="/images/fapemig-logo.png"
                  alt="Logo FAPEMIG"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 640px) 80px, (max-width: 768px) 112px, 128px"
                />
              </div>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Button 
                variant="ghost" 
                className="text-[#003366] hover:text-[#004080]"
                onClick={registerTrigger}
              >
                Cadastrar
              </Button>
              <Button 
                className="bg-[#003366] hover:bg-[#004080]"
                onClick={loginTrigger}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Entrar
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              className="md:hidden"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-[#003366]" />
              ) : (
                <Menu className="w-6 h-6 text-[#003366]" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            "md:hidden bg-white border-t border-gray-100 transition-all duration-300 overflow-hidden",
            isMobileMenuOpen ? "max-h-64" : "max-h-0"
          )}
        >
          <div className="container mx-auto px-4 py-4 space-y-3">
            <div className="flex flex-col space-y-2">
              <Button 
                variant="ghost" 
                className="w-full text-[#003366] hover:text-[#004080] justify-center"
                onClick={() => {
                  registerTrigger();
                  setIsMobileMenuOpen(false);
                }}
              >
                Cadastrar
              </Button>
              <Button 
                className="w-full bg-[#003366] hover:bg-[#004080] justify-center"
                onClick={() => {
                  loginTrigger();
                  setIsMobileMenuOpen(false);
                }}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Entrar
              </Button>
            </div>
          </div>
        </div>
      </header>
      {modals}
    </>
  );
}