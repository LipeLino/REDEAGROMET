"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSchema, UserRegistration } from "@/lib/types/auth";
import { registerUser, verifyEmail, resendVerificationCode } from "@/lib/services/auth";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserRegistration>({
    resolver: zodResolver(userSchema),
  });

  const handleRegistration = async (data: UserRegistration) => {
    setIsLoading(true);
    setError('');

    try {
      await registerUser(data);
      setEmail(data.email);
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await verifyEmail(email, verificationCode);
      if (result.success) {
        // Handle successful verification
        onClose();
        reset();
        setStep('register');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na verificação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      await resendVerificationCode(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reenviar código');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          reset();
          setStep('register');
          setError('');
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-lg">
        <DialogTitle className="text-2xl font-bold text-center text-[#003366] mb-6">
          {step === 'register' ? 'Criar Conta' : 'Verificar Email'}
        </DialogTitle>

        {step === 'register' ? (
          <form onSubmit={handleSubmit(handleRegistration)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input
                id="username"
                {...register('username')}
                className={errors.username ? 'border-red-500' : ''}
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="terms" {...register('acceptTerms')} />
              <Label htmlFor="terms" className="text-sm">
                Li e aceito os{' '}
                <a href="#" className="text-[#003366] hover:underline">
                  Termos de Uso
                </a>{' '}
                e a{' '}
                <a href="#" className="text-[#003366] hover:underline">
                  Política de Privacidade
                </a>
              </Label>
            </div>
            {errors.acceptTerms && (
              <p className="text-sm text-red-500">{errors.acceptTerms.message}</p>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-[#003366] hover:bg-[#004080]"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Cadastrar
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-gray-600">
              Digite o código de 6 dígitos enviado para seu email
            </p>

            <div className="space-y-2">
              <Input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="text-center text-2xl tracking-widest"
                placeholder="000000"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <Button 
              onClick={handleVerification}
              className="w-full bg-[#003366] hover:bg-[#004080]"
              disabled={isLoading || verificationCode.length !== 6}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Verificar
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                className="text-sm text-[#003366] hover:underline"
                disabled={isLoading}
              >
                Reenviar código
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}