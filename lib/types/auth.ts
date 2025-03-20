import { z } from 'zod';

export const userSchema = z.object({
  fullName: z.string()
    .min(3, 'Nome completo deve ter no mínimo 3 caracteres')
    .max(100, 'Nome completo deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'O nome deve conter apenas letras')
    .refine(
      name => name.trim().split(/\s+/).length >= 2,
      'Digite seu nome completo (nome e sobrenome)'
    ),
  email: z.string()
    .email('Email inválido')
    .refine(email => {
      const allowedDomains = ['@uemg.br', '@discente.uemg.br'];
      return allowedDomains.some(domain => email.endsWith(domain)) || email.includes('@');
    }, 'Email deve ser institucional UEMG ou um email válido'),
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .refine(
      password => /[A-Za-z]/.test(password), 
      'A senha deve conter pelo menos uma letra'
    )
    .refine(
      password => /\d/.test(password), 
      'A senha deve conter pelo menos um número'
    )
    .refine(
      password => /[^A-Za-z0-9]/.test(password), 
      'A senha deve conter pelo menos um caractere especial'
    ),
  confirmPassword: z.string(),
  acceptTerms: z.boolean()
    .refine(val => val === true, 'Você deve aceitar os termos de uso'),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas digitadas não coincidem",
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
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  accessLevel: 'full' | 'limited';
}
