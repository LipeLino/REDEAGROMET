"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

interface LoadingScreenProps {
  show: boolean;
}

export function LoadingScreen({ show }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (show) {
      // Quick progress to 40%
      const timer1 = setTimeout(() => setProgress(40), 100);
      // Slower progress to 70%
      const timer2 = setTimeout(() => setProgress(70), 500);
      // Even slower to 90%
      const timer3 = setTimeout(() => setProgress(90), 1000);
      // Complete just before redirect
      const timer4 = setTimeout(() => setProgress(100), 1800);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    } else {
      setProgress(0);
    }
  }, [show]);

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 bg-[#003366]/95 backdrop-blur-sm z-50",
        "flex flex-col items-center justify-center",
        "transition-opacity duration-500",
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="w-full max-w-md px-4 space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
          <h2 className="text-xl font-semibold text-white">
            Acessando o Dashboard
          </h2>
          <p className="text-white/80 text-center">
            Carregando suas informações e preferências...
          </p>
        </div>
        
        <div className="space-y-2">
          <Progress value={progress} className="h-1 bg-white/20" />
          <p className="text-sm text-white/60 text-center">
            {progress < 40 ? "Verificando credenciais..." :
             progress < 70 ? "Carregando dados..." :
             progress < 90 ? "Preparando dashboard..." :
             "Iniciando sistema..."}
          </p>
        </div>
      </div>
    </div>
  );
}
