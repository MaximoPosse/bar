const nodemailer = require('nodemailer');

async function enviarCorreo(destinatario, asunto, cuerpo) {
  try {
    // --- Configuración del transporter ---
    const transporter = nodemailer.createTransport({
      service: 'gmail', // o el servicio que uses (Outlook, SMTP personalizado, etc.)
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // --- Configuración del correo ---
    const mailOptions = {
      from: `"Empresa BarConnect 🍻" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: asunto,
      text: cuerpo,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #007BFF;">${asunto}</h2>
          <p>${cuerpo}</p>
          <hr/>

        </div>
      `,
    };

    // --- Envío del correo ---
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Correo enviado correctamente a ${destinatario} (ID: ${info.messageId})`);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error al enviar el correo:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {enviarCorreo};