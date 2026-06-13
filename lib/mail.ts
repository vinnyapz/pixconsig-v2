import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:2602';
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  const logoUrl = `${baseUrl}/logo-grupo.jpg`;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperação de Senha - Grupo Raman</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
      <!-- Container -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">

        <!-- Header -->
        <tr>
          <td align="center" style="padding: 30px 20px; border-bottom: 1px solid #eeeeee;">
             <!-- Logo Image with strict sizing -->
             <img src="${logoUrl}" alt="Logo Grupo Raman" width="150" style="display: block; width: 150px; max-width: 100%; height: auto; border: 0; outline: none; text-decoration: none;">
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding: 30px 20px; color: #333333; font-size: 16px; line-height: 1.6;">
            <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #333333; text-align: center;">Recuperação de Senha</h2>
            <p style="margin: 0 0 15px 0;">Olá,</p>
            <p style="margin: 0 0 15px 0;">Recebemos uma solicitação para redefinir a senha da sua conta.</p>
            <p style="margin: 0 0 25px 0;">Se você não fez essa solicitação, pode ignorar este email com segurança.</p>
            <p style="margin: 0 0 25px 0;">Para redefinir sua senha, clique no botão abaixo:</p>

            <div style="text-align: center; margin-bottom: 25px;">
              <a href="${resetLink}" style="display: inline-block; background-color: #0066A1; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Redefinir Senha</a>
            </div>

            <p style="margin: 0; font-size: 14px; color: #666666;">Este link expira em 1 hora.</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding: 20px; background-color: #f9f9fa; border-top: 1px solid #eeeeee; color: #888888; font-size: 12px;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Grupo Raman. Todos os direitos reservados.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Grupo Raman" <${SMTP_USER}>`,
      to: email,
      subject: 'Recuperação de Senha - Grupo Raman',
      html,
    });
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return false;
  }
}

export async function sendWelcomeEmail(email: string, pass: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:2602';
  const loginLink = `${baseUrl}/login`;
  const logoUrl = `${baseUrl}/logo-grupo.jpg`;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bem-vindo ao Grupo Raman</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
        <tr>
          <td align="center" style="padding: 30px 20px; border-bottom: 1px solid #eeeeee;">
             <img src="${logoUrl}" alt="Logo Grupo Raman" width="150" style="display: block; width: 150px; max-width: 100%; height: auto; border: 0; outline: none; text-decoration: none;">
          </td>
        </tr>
        <tr>
          <td style="padding: 30px 20px; color: #333333; font-size: 16px; line-height: 1.6;">
            <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #333333; text-align: center;">Bem-vindo ao Grupo Raman!</h2>
            <p style="margin: 0 0 15px 0;">Olá,</p>
            <p style="margin: 0 0 15px 0;">Sua conta de franqueado foi criada com sucesso.</p>
            <p style="margin: 0 0 15px 0;">Abaixo estão suas credenciais de acesso:</p>
            
            <div style="background-color: #f9f9fa; border: 1px solid #eeeeee; border-radius: 4px; padding: 15px; margin-bottom: 25px;">
              <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 0;"><strong>Senha Provisória:</strong> ${pass}</p>
            </div>

            <p style="margin: 0 0 25px 0;">Recomendamos que você altere sua senha após o primeiro acesso.</p>

            <div style="text-align: center; margin-bottom: 25px;">
              <a href="${loginLink}" style="display: inline-block; background-color: #0066A1; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Acessar Plataforma</a>
            </div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 20px; background-color: #f9f9fa; border-top: 1px solid #eeeeee; color: #888888; font-size: 12px;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Grupo Raman. Todos os direitos reservados.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Grupo Raman" <${SMTP_USER}>`,
      to: email,
      subject: 'Bem-vindo ao Grupo Raman - Suas Credenciais',
      html,
    });
    console.log('Welcome email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

export async function sendComunicadoEmail(email: string, name: string, title: string, message: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:2602';
  const logoUrl = `${baseUrl}/logo-grupo.jpg`;
  const loginLink = `${baseUrl}/dashboard`;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
        <tr>
          <td align="center" style="padding: 30px 20px; border-bottom: 1px solid #eeeeee;">
            <img src="${logoUrl}" alt="Logo Grupo Raman" width="150" style="display: block; width: 150px; max-width: 100%; height: auto;">
          </td>
        </tr>
        <tr>
          <td style="padding: 30px 20px; color: #333333; font-size: 16px; line-height: 1.6;">
            <p style="margin: 0 0 10px 0; color: #888888; font-size: 13px;">📢 COMUNICADO OFICIAL</p>
            <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #0066A1;">${title}</h2>
            <p style="margin: 0 0 10px 0;">Olá, <strong>${name}</strong>!</p>
            <div style="background-color: #f9f9fa; border-left: 4px solid #0066A1; padding: 15px 20px; margin: 20px 0; border-radius: 0 6px 6px 0; color: #444444; white-space: pre-line;">
              ${message}
            </div>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${loginLink}" style="display: inline-block; background-color: #0066A1; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">
                Acessar a Plataforma
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 20px; background-color: #f9f9fa; border-top: 1px solid #eeeeee; color: #888888; font-size: 12px;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Grupo Raman. Todos os direitos reservados.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"PixConsig" <${SMTP_USER}>`,
      to: email,
      subject: `📢 ${title}`,
      html,
    });
    return true;
  } catch (error) {
    console.error('Error sending comunicado email:', error);
    return false;
  }
}
