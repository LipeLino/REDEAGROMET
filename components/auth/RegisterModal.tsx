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
  onSwitchToLogin?: () => void; // Make it optional with ?
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
        action: 'generateCode', // Adicione este parâmetro
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

export function RegisterModal({ 
  isOpen, 
  onClose, 
  onSwitchToLogin = () => {} // Default empty function
}: RegisterModalProps) {
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
  const [showLoginForm, setShowLoginForm] = useState(false);

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

  useEffect(() => {
    // Create a style element
    const style = document.createElement('style');
    
    // Add CSS to hide browser password reveal buttons
    style.textContent = `
      input::-ms-reveal,
      input::-ms-clear,
      input::-webkit-contacts-auto-fill-button,
      input::-webkit-credentials-auto-fill-button {
        display: none !important;
        visibility: hidden;
        pointer-events: none;
      }
    `;
    
    // Add the style to document head
    document.head.appendChild(style);
    
    // Clean up when component unmounts
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleRegistration = async (data: UserRegistration) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generateCode',
          name: data.fullName,
          email: data.email
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Store email for verification step
        setEmail(data.email);
        setStep('verify');
      } else {
        setError(result.message || 'Erro ao enviar código de verificação');
      }
    } catch (err) {
      console.error('Error sending verification code:', err);
      setError('Erro ao processar solicitação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'verifyCode',
          email: email,
          code: verificationCode
        })
      });

      const result = await response.json();
      if (result.success) {
        // Put the two messages in separate <p> tags (within the render)
        setSuccess('Verificação concluída!__DIVIDER__Sua conta foi criada com sucesso.');
        setStep('success');
        // NOTE: Do NOT call onClose() here
      } else {
        setError(result.message || 'Código inválido ou expirado.');
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

  const handleLoginSubmit = (email: string, password: string) => {
    // Implement your login logic here
    console.log('Logging in with:', email, password);
    // After successful login:
    onClose();
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          // Only reset state if user manually closes
          reset();
          setStep('register');
          setError('');
          setShowLoginForm(false); // Reset this too
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-lg">
        <DialogTitle className="text-2xl font-bold text-center text-[#003366] mb-6">
          {step === 'register' ? 'Criar Conta' : step === 'verify' ? 'Verificar Email' : 'Sucesso'}
        </DialogTitle>

        {step === 'register' && (
          <form onSubmit={handleSubmit(handleRegistration)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                {...register('fullName')}
                className={errors.fullName ? 'border-red-500' : ''}
                placeholder="Digite seu nome e sobrenome"
              />              
              <div>
              {errors.fullName && (
                <p className="text-xs text-red-500 -mb-2">{errors.fullName.message}</p>
              )}              
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
                placeholder="seu.email@exemplo.com"
              />
              <div>
              {errors.email && (
                <p className="text-xs text-red-500 -mb-2">{errors.email.message}</p>
              )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register('password')}
                  className={cn(
                    errors.password ? 'border-red-500' : '',
                    'pr-10',
                    'appearance-none' // This will disable browser-default styling
                  )}
                  placeholder="Mínimo de 8 caracteres"
                  autoComplete="new-password" // Helps prevent browser auto-styling
                />
                {passwordValue && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10" // Added z-10
                    tabIndex={-1} // Keep it out of tab order for accessibility
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
              <div>
              {errors.password && (
                <p className="text-xs text-red-500 -mb-2">{errors.password.message}</p>
              )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register('confirmPassword')}
                  className={cn(
                    errors.confirmPassword ? 'border-red-500' : '',
                    'pr-10',
                    'appearance-none' // This will disable browser-default styling
                  )}
                  placeholder="Digite a senha novamente"
                  autoComplete="new-password" // Helps prevent browser auto-styling
                />
                {confirmPasswordValue && (
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10" // Added z-10
                    tabIndex={-1} // Keep it out of tab order for accessibility
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
              <div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 -mb-2">{errors.confirmPassword.message}</p>
              )}
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-3 pl-0.5">
              <Checkbox 
                id="acceptTerms" 
                onCheckedChange={(checked) => {
                  setValue('acceptTerms', checked === true);
                }}
              />
              <Label htmlFor="acceptTerms" className="text-[0.8rem]">
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
            <div>
            {errors.acceptTerms && (
              <p className="text-xs text-red-500 -mt-2 mb-4">{errors.acceptTerms.message}</p>
            )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-[#003366] hover:bg-[#004080] !-mt-0"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Cadastrar
            </Button>
          </form>
        )}

        {step === 'verify' && (
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

        {step === 'success' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center animate-pulse justify-center"> 
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-800 text-center">
                {success.split('__DIVIDER__').map((line, i) => (
                  <span key={i}>
                    {line}
                    <br />
                  </span>
                ))}
              </p>
              <p className="text-center text-gray-600 mt-2">
                Agora você pode logar com suas novas credenciais.
              </p>
            </div>

            <Button
              onClick={() => {
                onClose();           // Close this modal first
                onSwitchToLogin();   // Then trigger opening the login modal
              }}
              className="w-full bg-[#003366] hover:bg-[#004080] transition-colors"
            >
              Prossiga ao log-in
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


