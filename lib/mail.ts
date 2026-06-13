import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'PixConsig <noreply@pixconsig.com.br>';

export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:2602';
  const resetLink = `${baseUrl}/reset-password?token=${token}`;
  const logoUrl = `${baseUrl}/logo-grupo.jpg`;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
        <tr><td align="center" style="padding: 30px 20px; border-bottom: 1px solid #eeeeee;">
          <img src="${logoUrl}" alt="PixConsig" width="150" style="display: block; width: 150px; max-width: 100%; height: auto;">
        </td></tr>
        <tr><td style="padding: 30px 20px; color: #333333; font-size: 16px; line-height: 1.6;">
          <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #333333; text-align: center;">Recuperação de Senha</h2>
          <p style="margin: 0 0 15px 0;">Olá,</p>
          <p style="margin: 0 0 15px 0;">Recebemos uma solicitação para redefinir a senha da sua conta.</p>
          <p style="margin: 0 0 25px 0;">Se você não fez essa solicitação, pode ignorar este email com segurança.</p>
          <div style="text-align: center; margin-bottom: 25px;">
            <a href="${resetLink}" style="display: inline-block; background-color: #0066A1; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Redefinir Senha</a>
          </div>
          <p style="margin: 0; font-size: 14px; color: #666666;">Este link expira em 1 hora.</p>
        </td></tr>
        <tr><td align="center" style="padding: 20px; background-color: #f9f9fa; border-top: 1px solid #eeeeee; color: #888888; font-size: 12px;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} PixConsig. Todos os direitos reservados.</p>
        </td></tr>
      </table>
    </body></html>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Recuperação de Senha - PixConsig',
      html,
    });
    if (error) { console.error('Resend error:', error); return false; }
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
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
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
        <tr><td align="center" style="padding: 30px 20px; border-bottom: 1px solid #eeeeee;">
          <img src="${logoUrl}" alt="PixConsig" width="150" style="display: block; width: 150px; max-width: 100%; height: auto;">
        </td></tr>
        <tr><td style="padding: 30px 20px; color: #333333; font-size: 16px; line-height: 1.6;">
          <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #333333; text-align: center;">Bem-vindo ao PixConsig!</h2>
          <p style="margin: 0 0 15px 0;">Olá,</p>
          <p style="margin: 0 0 15px 0;">Sua conta foi criada com sucesso. Abaixo estão suas credenciais:</p>
          <div style="background-color: #f9f9fa; border: 1px solid #eeeeee; border-radius: 4px; padding: 15px; margin-bottom: 25px;">
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 0;"><strong>Senha Provisória:</strong> ${pass}</p>
          </div>
          <p style="margin: 0 0 25px 0;">Recomendamos que você altere sua senha após o primeiro acesso.</p>
          <div style="text-align: center; margin-bottom: 25px;">
            <a href="${loginLink}" style="display: inline-block; background-color: #0066A1; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Acessar Plataforma</a>
          </div>
        </td></tr>
        <tr><td align="center" style="padding: 20px; background-color: #f9f9fa; border-top: 1px solid #eeeeee; color: #888888; font-size: 12px;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} PixConsig. Todos os direitos reservados.</p>
        </td></tr>
      </table>
    </body></html>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Bem-vindo ao PixConsig - Suas Credenciais',
      html,
    });
    if (error) { console.error('Resend error:', error); return false; }
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

export async function sendNotificationEmail(to: string, title: string, content: string, link: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:2602';
  const logoUrl = `${baseUrl}/logo-grupo.jpg`;
  const fullLink = `${baseUrl}${link}`;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
        <tr><td align="center" style="padding: 30px 20px; border-bottom: 1px solid #eeeeee;">
          <img src="${logoUrl}" alt="PixConsig" width="150" style="display: block; width: 150px; max-width: 100%; height: auto;">
        </td></tr>
        <tr><td style="padding: 30px 20px; color: #333333; font-size: 16px; line-height: 1.6;">
          <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #0066A1;">${title}</h2>
          <p style="margin: 0 0 25px 0; color: #555555;">${content}</p>
          <div style="text-align: center; margin-bottom: 25px;">
            <a href="${fullLink}" style="display: inline-block; background-color: #0066A1; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">Ver no Sistema</a>
          </div>
        </td></tr>
        <tr><td align="center" style="padding: 20px; background-color: #f9f9fa; border-top: 1px solid #eeeeee; color: #888888; font-size: 12px;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} PixConsig. Todos os direitos reservados.</p>
        </td></tr>
      </table>
    </body></html>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `🔔 ${title}`,
      html,
    });
    if (error) console.error('Resend notification error:', error);
  } catch (error) {
    console.error('Error sending notification email:', error);
  }
}

export async function sendComunicadoEmail(email: string, name: string, title: string, message: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:2602';
  const logoUrl = `${baseUrl}/logo-grupo.jpg`;
  const loginLink = `${baseUrl}/dashboard`;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
        <tr><td align="center" style="padding: 30px 20px; border-bottom: 1px solid #eeeeee;">
          <img src="${logoUrl}" alt="PixConsig" width="150" style="display: block; width: 150px; max-width: 100%; height: auto;">
        </td></tr>
        <tr><td style="padding: 30px 20px; color: #333333; font-size: 16px; line-height: 1.6;">
          <p style="margin: 0 0 10px 0; color: #888888; font-size: 13px;">📢 COMUNICADO OFICIAL</p>
          <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #0066A1;">${title}</h2>
          <p style="margin: 0 0 10px 0;">Olá, <strong>${name}</strong>!</p>
          <div style="background-color: #f9f9fa; border-left: 4px solid #0066A1; padding: 15px 20px; margin: 20px 0; border-radius: 0 6px 6px 0; color: #444444;">
            ${message}
          </div>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${loginLink}" style="display: inline-block; background-color: #0066A1; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">Acessar a Plataforma</a>
          </div>
        </td></tr>
        <tr><td align="center" style="padding: 20px; background-color: #f9f9fa; border-top: 1px solid #eeeeee; color: #888888; font-size: 12px;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} PixConsig. Todos os direitos reservados.</p>
        </td></tr>
      </table>
    </body></html>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: `📢 ${title}`,
      html,
    });
    if (error) { console.error('Resend error:', error); return false; }
    return true;
  } catch (error) {
    console.error('Error sending comunicado email:', error);
    return false;
  }
}
