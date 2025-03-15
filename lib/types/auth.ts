import { z } from 'zod';

export const userSchema = z.object({
  username: z.string()
    .min(4, 'Nome de usuário deve ter no mínimo 4 caracteres')
    .max(30, 'Nome de usuário deve ter no máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Nome de usuário deve conter apenas letras, números e _'),
  email: z.string()
    .email('Email inválido')
    .refine(email => {
      const allowedDomains = ['@uemg.br', '@discente.uemg.br'];
      return allowedDomains.some(domain => email.endsWith(domain)) || email.includes('@');
    }, 'Email deve ser institucional UEMG ou um email válido'),
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/, 
      'Senha deve conter letras e números'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean()
    .refine(val => val === true, 'Você deve aceitar os termos de uso'),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type UserRegistration = z.infer<typeof userSchema>;

export interface VerificationCode {
  code: string;
  email: string;
  expiresAt: Date;
}

export interface RegisteredUser {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  accessLevel: 'full' | 'limited';
}