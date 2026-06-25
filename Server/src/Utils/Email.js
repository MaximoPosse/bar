/**
 * Utilidades de Correo Electrónico
 * 
 * Envía correos mediante Nodemailer usando Gmail como servicio SMTP.
 * Las credenciales se configuran en el archivo .env
 */

const nodemailer = require('nodemailer');

/**
 * Envía un correo electrónico al destinatario especificado.
 * @param {string} destinatario - Correo electrónico del destinatario
 * @param {string} asunto - Asunto del mensaje
 * @param {string} cuerpo - Contenido del mensaje en texto plano
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function enviarCorreo(destinatario, asunto, cuerpo) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"BarConnect" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: asunto,
      text: cuerpo,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #007BFF;">${asunto}</h2>
          <p>${cuerpo}</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Correo enviado a ${destinatario} (ID: ${info.messageId})`);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error al enviar el correo:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { enviarCorreo };