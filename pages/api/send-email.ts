// pages/api/send-email.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('API route hit:', req.method, req.body);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: name and email' 
      });
    }
    
    // Create email HTML body
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bem-vindo(a) à REDEAGROMET!</h2>
        <p>Olá ${name},</p>
        <p>Obrigado por se cadastrar na nossa plataforma.</p>
        <p>Seu cadastro foi recebido com sucesso e está sendo processado.</p>
        <p>Atenciosamente,<br>Equipe REDEAGROMET</p>
      </div>
    `;
    
    // Create text version
    const textBody = `Olá ${name},\n\nObrigado por se cadastrar na REDEAGROMET.\n\nSeu cadastro foi recebido com sucesso e está sendo processado.\n\nAtenciosamente,\nEquipe REDEAGROMET`;

    try {
      // Send email using SmtpLW API
      console.log('Sending email via SmtpLW API...');
      
      const API_URL = 'https://api.smtplw.com.br/v1/messages';
      const AUTH_TOKEN = process.env.SMTPLW_AUTH_TOKEN || ''; // Get from env var
      
      // Prepare the request payload
      const emailData = {
        subject: 'Confirmação de Cadastro - REDEAGROMET',
        body: htmlBody,
        from: process.env.SMTP_USER || 'suporte@redeagromet.com.br',
        to: email,
        headers: {
          'Content-Type': 'text/html'
        }
      };
      
      // Make API request
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': AUTH_TOKEN
        },
        body: JSON.stringify(emailData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SmtpLW API error: ${response.status} ${errorText}`);
      }
      
      // Get the message ID from response
      const messageLocation = response.headers.get('Location');
      const messageId = messageLocation ? messageLocation.split('/').pop() : 'unknown';
      
      console.log('Email sent successfully via API, message ID:', messageId);
      return res.status(200).json({ 
        success: true, 
        message: 'Email enviado com sucesso',
        messageId: messageId
      });
      
    } catch (apiError) {
      console.error('API error:', apiError);
      throw apiError; // Re-throw to be caught by outer try/catch
    }
    
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro ao enviar email' 
    });
  }
}