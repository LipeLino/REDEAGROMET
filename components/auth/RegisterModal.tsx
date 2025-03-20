"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSchema, UserRegistration } from "@/lib/types/auth";
import { verifyEmail, resendVerificationCode } from "@/lib/services/auth";
import { cn } from "@/lib/utils";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export async function registerUser(data: UserRegistration) {
  console.log('Sending registration data:', data);
  
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: data.fullName,
        email: data.email
      }),
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || 'Failed to send email');
      } catch (e) {
        throw new Error(`Server error: ${response.status} ${errorText.substring(0, 100)}`);
      }
    }
    
    const result = await response.json();
    console.log('API success response:', result);
    return result;
    
  } catch (error) {
    console.error('Fetch error details:', error);
    throw error;
  }
}

export function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
  const [step, setStep] = useState<'register' | 'verify' | 'success'>('register');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailPreviewUrl, setEmailPreviewUrl] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UserRegistration>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      acceptTerms: false
    }
  });

  // Watch password fields to determine if we should show the eye icons
  const passwordValue = watch('password');
  const confirmPasswordValue = watch('confirmPassword');

  const handleRegistration = async (data: UserRegistration) => {
    setIsLoading(true);
    setError('');
    setSubmitAttempts(prev => prev + 1);
    
    try {
      const result = await registerUser(data);
      if (result.success) {
        setEmail(data.email);
        setStep('verify');
        
        if ((result as any).verificationCode && process.env.NODE_ENV === 'development') {
          setVerificationCode((result as any).verificationCode);
        }
      }
    } catch (err) {
      console.error('Registration error details:', err);
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
      const result = await resendVerificationCode(email);
      if (result.verificationCode && process.env.NODE_ENV === 'development') {
        setVerificationCode(result.verificationCode);
      }
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
          {step === 'register' ? 'Criar Conta' : step === 'verify' ? 'Verificar Email' : 'Sucesso'}
        </DialogTitle>

        {step === 'register' ? (
          <form onSubmit={handleSubmit(handleRegistration)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                {...register('fullName')}
                className={errors.fullName ? 'border-red-500' : ''}
                placeholder="Digite seu nome e sobrenome"
              />
              {errors.fullName && (
                <p className="text-sm text-red-500">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
                placeholder="seu.email@exemplo.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register('password')}
                  className={cn(
                    errors.password ? 'border-red-500' : '',
                    'pr-10'
                  )}
                  placeholder="Mínimo de 8 caracteres"
                />
                {passwordValue && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register('confirmPassword')}
                  className={cn(
                    errors.confirmPassword ? 'border-red-500' : '',
                    'pr-10'
                  )}
                  placeholder="Digite a senha novamente"
                />
                {confirmPasswordValue && (
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="acceptTerms" 
                onCheckedChange={(checked) => {
                  setValue('acceptTerms', checked === true);
                }}
              />
              <Label htmlFor="acceptTerms" className="text-sm">
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
        ) : step === 'verify' ? (
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
        ) : (
          <div className="space-y-4">
            <p className="text-center text-gray-600">
              {success}
            </p>
            {emailPreviewUrl && (
              <div className="text-center">
                <a href={emailPreviewUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#003366] hover:underline">
                  Visualizar Email
                </a>
              </div>
            )}
            <Button 
              onClick={() => {
                onClose();
                reset();
                setStep('register');
              }}
              className="w-full bg-[#003366] hover:bg-[#004080]"
            >
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
