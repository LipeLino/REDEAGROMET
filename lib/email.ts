import nodemailer from 'nodemailer';

// Create reusable transporter
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(email: string, code: string, name: string) {
  try {
    console.log(`Sending verification email to ${email} with code ${code}`);
    
    const info = await transporter.sendMail({
      from: `"comunica@redeagromet.com.br" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Verifique seu email - REDEAGROMET",
      text: `Olá ${name},\n\nSeu código de verificação é: ${code}\n\nEste código expira em 10 minutos.\n\nAtenciosamente,\nEquipe REDEAGROMET`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">REDEAGROMET</h2>
          <p>Olá <strong>${name}</strong>,</p>
          <p>Obrigado por se registrar no REDEAGROMET. Para verificar seu email, use o código abaixo:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
            <strong>${code}</strong>
          </div>
          <p>Este código expira em <strong>10 minutos</strong>.</p>
          <p>Se você não solicitou este código, por favor ignore este email.</p>
          <p>Atenciosamente,<br>Equipe REDEAGROMET</p>
        </div>
      `,
    });
    
    console.log("Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}