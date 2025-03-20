"use client";

import { Button } from "@/components/ui/button";
import { Home, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function DashboardHeader() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-lg sm:text-xl font-semibold text-[#003366] truncate">
            Sistema de Monitoramento Agrometeorológico
          </h1>
          
          {/* Desktop Button */}
          <Button
            variant="ghost"
            className="text-[#003366] hidden sm:flex"
            onClick={() => router.push("/")}
          >
            <Home className="w-4 h-4 mr-2" />
            Página Inicial
          </Button>
          
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            className="p-2 sm:hidden"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-[#003366]" />
            ) : (
              <Menu className="w-5 h-5 text-[#003366]" />
            )}
          </Button>
        </div>
        
        {/* Mobile Menu */}
        <div className={cn(
          "sm:hidden overflow-hidden transition-all duration-300 ease-in-out",
          isMobileMenuOpen ? "max-h-60" : "max-h-0"
        )}>
          <div className="py-3 border-t border-gray-100">
            <Button
              variant="ghost"
              className="w-full justify-start text-[#003366]"
              onClick={() => {
                router.push("/");
                setIsMobileMenuOpen(false);
              }}
            >
              <Home className="w-4 h-4 mr-2" />
              Página Inicial
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
