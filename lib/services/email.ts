import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  auth: {
    user: string;
    pass: string;
  };
}

const emailConfig: EmailConfig = {
  host: process.env.SMTP_HOST || '',
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

const transporter = nodemailer.createTransport({
  ...emailConfig,
  secure: false,
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

export async function sendVerificationEmail(email: string, code: string, fullName: string) {
  try {
    const firstName = fullName.split(' ')[0];
    
    const mailOptions = {
      from: {
        name: 'Rede Agrometeorológica',
        address: 'noreply@redeagromet.com.br'
      },
      to: email,
      subject: 'Verificação de Email - Rede Agrometeorológica',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #003366;">Olá ${firstName}!</h2>
          
          <p>Bem-vindo(a) à Rede Agrometeorológica do Triângulo Mineiro Sul. Para completar seu cadastro, utilize o código de verificação abaixo:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #003366; letter-spacing: 5px; font-size: 32px;">${code}</h1>
          </div>
          
          <p>Este código é válido por 10 minutos. Se você não solicitou este cadastro, por favor ignore este email.</p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Atenciosamente,<br>
            Equipe Rede Agrometeorológica
          </p>
          
          <hr style="border: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Este é um email automático. Por favor, não responda.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Falha ao enviar email de verificação');
  }
}
