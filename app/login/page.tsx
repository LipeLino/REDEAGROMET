"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoadingScreen } from "@/components/auth/LoadingScreen";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setError("");
    setIsLoading(true);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (email === "admin" && password === "admin") {
        router.push("/dashboard");
      } else {
        throw new Error("Credenciais inválidas");
      }
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    }
  };

  return (
    <AuthLayout>
      <LoadingScreen show={isLoading} />
      <LoginForm onSubmit={handleLogin} error={error} />
    </AuthLayout>
  );
}