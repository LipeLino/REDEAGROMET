"use client";

import { UserRegistration, VerificationCode } from '@/lib/types/auth';

// In-memory storage (replace with database in production)
const verificationCodes = new Map<string, VerificationCode>();
const registeredUsers = new Map<string, UserRegistration>();

// Simulated rate limiter
class RateLimiter {
  private attempts = new Map<string, number[]>();
  private maxAttempts = 5;
  private windowMs = 3600000; // 1 hour

  consume(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove expired attempts
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }
}

const rateLimiter = new RateLimiter();

// Simple password hashing (for demo purposes)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function registerUser(userData: UserRegistration) {
  try {
    // Rate limiting check
    if (!rateLimiter.consume(userData.email)) {
      throw new Error('Muitas tentativas. Tente novamente mais tarde.');
    }

    // Check if email is already registered
    if (registeredUsers.has(userData.email)) {
      throw new Error('Email já cadastrado');
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification code
    verificationCodes.set(userData.email, {
      code: verificationCode,
      email: userData.email,
      expiresAt,
    });

    // Store user data
    registeredUsers.set(userData.email, {
      ...userData,
      password: hashedPassword,
    });

    // In a real application, this would send an email
    console.log('Verification code for', userData.email, ':', verificationCode);

    return {
      success: true,
      message: 'Código de verificação enviado para seu email',
      // For demo purposes only, remove in production
      code: verificationCode,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Erro ao registrar usuário');
  }
}

export async function verifyEmail(email: string, code: string) {
  const verification = verificationCodes.get(email);

  if (!verification) {
    throw new Error('Código de verificação não encontrado');
  }

  if (new Date() > verification.expiresAt) {
    verificationCodes.delete(email);
    throw new Error('Código de verificação expirado');
  }

  if (verification.code !== code) {
    throw new Error('Código de verificação inválido');
  }

  // Mark email as verified
  const user = registeredUsers.get(email);
  if (user) {
    const verifiedUser = {
      id: crypto.randomUUID(),
      username: user.username,
      email: user.email,
      emailVerified: true,
      createdAt: new Date(),
      accessLevel: getAccessLevel(email),
    };
    registeredUsers.set(email, { ...user, emailVerified: true });
  }

  // Clean up verification code
  verificationCodes.delete(email);

  return {
    success: true,
    accessLevel: getAccessLevel(email),
  };
}

export async function resendVerificationCode(email: string) {
  const user = registeredUsers.get(email);
  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  // Generate new verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  verificationCodes.set(email, {
    code: verificationCode,
    email,
    expiresAt,
  });

  // In a real application, this would send an email
  console.log('New verification code for', email, ':', verificationCode);

  return {
    success: true,
    message: 'Novo código de verificação enviado',
    // For demo purposes only, remove in production
    code: verificationCode,
  };
}

function getAccessLevel(email: string): 'full' | 'limited' {
  return email.endsWith('@uemg.br') || email.endsWith('@discente.uemg.br')
    ? 'full'
    : 'limited';
}