"use client";

import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useRouter } from "next/navigation";

export function DashboardHeader() {
  const router = useRouter();

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-semibold text-[#003366]">
            Sistema de Monitoramento Agrometeorológico
          </h1>
          <Button
            variant="ghost"
            className="text-[#003366]"
            onClick={() => router.push("/")}
          >
            <Home className="w-4 h-4 mr-2" />
            Página Inicial
          </Button>
        </div>
      </div>
    </header>
  );
}