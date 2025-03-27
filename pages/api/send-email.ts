// pages/api/send-email.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

// Armazenamento temporário para os códigos de verificação
const verificationCodes = new Map<string, string>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('API route hit:', req.method, req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Podemos usar um parâmetro "action" para diferenciar envio e verificação
  const { action, name, email, code: providedCode } = req.body;
  console.log('Action requested:', action, 'for email:', email);

  // Para gerar e enviar o código
  if (action === 'generateCode') {
    console.log('Generating verification code for:', email);
    if (!name || !email) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name and email',
      });
    }

    // Gera um código simples de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated code:', code, 'for email:', email);

    // Armazena internamente (use DB em produção)
    verificationCodes.set(email, code);
    console.log('Stored codes:', Array.from(verificationCodes.entries()));

    try {
      // Crie e verifique transporter, então envie o email
      console.log('Creating email transporter with SMTP host:', process.env.SMTP_HOST);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 465,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          rejectUnauthorized: true,
          ciphers: 'SSLv3'
        },
        debug: true, // Enable debug logs
        logger: true // Enable logger
      });

      console.log('Verifying SMTP connection...');
      await transporter.verify();
      console.log('SMTP connection verified successfully');

      // Generate a unique Message-ID
      const messageId = `${Date.now()}.${Math.random().toString(36).substring(2, 12)}@comunica.redeagromet.com.br`;
      console.log('Generated message ID:', messageId);
      
      console.log('Sending email to:', email);
      const info = await transporter.sendMail({
        from: {
          name: 'Rede Agromet',
          address: 'suporte@comunica.redeagromet.com.br'
        },
        to: email,
        subject: 'Seu código de verificação - REDEAGROMET',
        text: `Olá ${name},\n\nSeu código de verificação é: ${code}\n\nUse este código para confirmar seu cadastro.\n\nEquipe REDEAGROMET`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <p>Olá ${name},</p>
            <p>Seu código de verificação é: <strong>${code}</strong></p>
            <p>Use este código para confirmar seu cadastro.</p>
            <p>Atenciosamente,<br>Equipe REDEAGROMET</p>
          </div>
        `,
        messageId: messageId
      });

      console.log('Email sent response:', info);
      console.log('Código de verificação enviado:', info.messageId);
      return res.status(200).json({
        success: true,
        message: 'Código de verificação enviado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao enviar código de verificação:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar código de verificação'
      });
    }
  }

  // Para verificar o código gerado
  if (action === 'verifyCode') {
    console.log('Verifying code for email:', email);
    if (!email || !providedCode) {
      console.log('Missing email or code for verification');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email and code'
      });
    }

    const storedCode = verificationCodes.get(email);
    console.log('Stored code:', storedCode, 'Provided code:', providedCode);

    if (storedCode && storedCode === providedCode) {
      // Se os códigos baterem, confirme o cadastro
      console.log('Code verified successfully for:', email);
      verificationCodes.delete(email); // Remove da memória
      return res.status(200).json({
        success: true,
        message: 'Código válido! Cadastro confirmado.'
      });
    } else {
      console.log('Invalid or expired code for:', email);
      return res.status(400).json({
        success: false,
        message: 'Código inválido ou expirado'
      });
    }
  }

  // Se chegou aqui, é porque a ação não foi reconhecida
  console.log('Invalid action requested:', action);
  return res.status(400).json({
    success: false,
    message: 'Ação inválida. Use action=generateCode ou action=verifyCode'
  });
}