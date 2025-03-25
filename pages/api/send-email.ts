// pages/api/send-email.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

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
    
    try {
      // First try with your SMTP service
      console.log('Attempting to use configured SMTP service...');
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // Always false for port 587 (STARTTLS)
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        // Fix TLS configuration for port 587
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        // Add authentication method explicitly
        authMethod: 'PLAIN', // Try 'LOGIN' if this continues to fail
        debug: true,
        logger: true
      });
      
      // Verify connection configuration
      await transporter.verify();
      console.log('SMTP connection verified successfully');
      
      const info = await transporter.sendMail({
        from: `"comunica@redeagromet.com.br" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Confirmação de Cadastro - REDEAGROMET',
        text: `Olá ${name},\n\nObrigado por se cadastrar na REDEAGROMET.\n\nSeu cadastro foi recebido com sucesso e está sendo processado.\n\nAtenciosamente,\nEquipe REDEAGROMET`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Bem-vindo(a) à REDEAGROMET!</h2>
            <p>Olá ${name},</p>
            <p>Obrigado por se cadastrar na nossa plataforma.</p>
            <p>Seu cadastro foi recebido com sucesso e está sendo processado.</p>
            <p>Atenciosamente,<br>Equipe REDEAGROMET</p>
          </div>
        `
      });
      
      console.log('Email sent successfully:', info.messageId);
      return res.status(200).json({ success: true, message: 'Email enviado com sucesso' });
      
    } catch (smtpError) {
      console.error('SMTP error, falling back to Ethereal:', smtpError);
      
      // Fallback to Ethereal for testing
      console.log('Creating test account with Ethereal...');
      const testAccount = await nodemailer.createTestAccount();
      
      const testTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      
      console.log('Sending test email...');
      const info = await testTransporter.sendMail({
        from: '"REDEAGROMET Test" <test@ethereal.email>', // Use an Ethereal address here, not your real domain
        to: email,
        subject: 'Confirmação de Cadastro - REDEAGROMET (Test)',
        text: `Olá ${name},\n\nObrigado por se cadastrar na REDEAGROMET.\n\nSeu cadastro foi recebido com sucesso e está sendo processado.\n\nAtenciosamente,\nEquipe REDEAGROMET`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Bem-vindo(a) à REDEAGROMET!</h2>
            <p>Olá ${name},</p>
            <p>Obrigado por se cadastrar na nossa plataforma.</p>
            <p>Seu cadastro foi recebido com sucesso e está sendo processado.</p>
            <p>Atenciosamente,<br>Equipe REDEAGROMET</p>
          </div>
        `
      });
      
      console.log('Test email sent:', nodemailer.getTestMessageUrl(info));
      return res.status(200).json({
        success: true,
        message: 'Email de teste enviado com sucesso (modo de teste)',
        previewUrl: nodemailer.getTestMessageUrl(info),
        note: 'O sistema está em modo de teste. Em um ambiente de produção, o email seria enviado para o endereço real.'
      });
    }
    
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro ao enviar email' 
    });
  }
}