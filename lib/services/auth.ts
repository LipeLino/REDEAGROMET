"use client";

import { UserRegistration, VerificationCode, RegisteredUser } from '@/lib/types/auth';

export async function registerUser(data: UserRegistration) {
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

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Falha ao enviar email');
    }
    
    return { success: true, message: 'Email enviado com sucesso' };
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
}

export async function verifyEmail(email: string, code: string) {
  try {
    console.log('Verifying email with code:', email, code);
    
    // Add request timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout
    
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('Verification API response status:', response.status);
    const data = await response.json();
    console.log('Verification API response:', data);
    
    if (!data.success) {
      throw new Error(data.error || 'Erro na verificação');
    }

    return {
      success: true,
      accessLevel: data.accessLevel,
    };
  } catch (error) {
    console.error('Verification error:', error);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Tempo limite da solicitação excedido. Verifique sua conexão de internet.');
      }
      throw new Error(error.message);
    }
    throw new Error('Erro ao verificar email');
  }
}

export async function resendVerificationCode(email: string) {
  try {
    console.log('Resending verification code for:', email);
    
    // Add request timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch('/api/auth/resend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('Resend API response status:', response.status);
    
    // Check if the response is not JSON (likely HTML error page)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const htmlResponse = await response.text();
      console.error('Server returned non-JSON response:', htmlResponse.substring(0, 200) + '...');
      throw new Error('O servidor encontrou um erro. Por favor, tente novamente mais tarde.');
    }
    
    const data = await response.json();
    console.log('Resend API response:', data);
    
    if (!data.success) {
      throw new Error(data.error || 'Erro ao reenviar código');
    }

    return {
      success: true,
      message: 'Novo código de verificação enviado',
      verificationCode: data.verificationCode
    };
  } catch (error) {
    console.error('Resend verification code error:', error);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Tempo limite da solicitação excedido. Verifique sua conexão de internet.');
      }
      throw new Error(error.message);
    }
    throw new Error('Erro ao reenviar código de verificação');
  }
}
