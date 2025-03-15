"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle } from "lucide-react";
import { LoadingScreen } from "./LoadingScreen";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      if (email === "admin" && password === "admin") {
        setIsClosing(true);
        // Wait for dialog fade out
        await new Promise(resolve => setTimeout(resolve, 300));
        setIsLoading(true);
        
        // Simulate loading and dashboard preparation
        redirectTimeoutRef.current = setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      } else {
        throw new Error("Credenciais inválidas");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    }
  };

  // Cleanup timeout on unmount
  const cleanup = () => {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }
  };

  return (
    <>
      <LoadingScreen show={isLoading} />
      <Dialog 
        open={isOpen && !isClosing} 
        onOpenChange={(open) => {
          if (!open) {
            cleanup();
            onClose();
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-lg">
          <DialogTitle className="text-2xl font-bold text-center text-[#003366] mb-6">
            Entrar no Sistema
          </DialogTitle>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Usuário</Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu usuário"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label htmlFor="remember" className="text-sm">
                Lembrar-me
              </Label>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
            <Button type="submit" className="w-full bg-[#003366] hover:bg-[#004080]">
              Entrar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}