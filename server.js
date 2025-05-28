import express from 'express';
import nodemailer from 'nodemailer';
import bodyParser from 'body-parser';
import cors from 'cors'; 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const transporter = nodemailer.createTransport({
  host: 'in-v3.mailjet.com',
  port: 587,
  secure: false,
  auth: {
    user: '9cc11f30814a33827038897d882171ba',
    pass: '6f62026af89ac6862ab83c53768b8a2a'
  }
});

function registrarEnvio(Correo, Nombres, Puesto) {
  const logEntry = {
    Correo,
    Nombres,
    Puesto,
    fecha: new Date().toISOString(),
  };
  const logFilePath = path.join(__dirname, 'envios.log');
  fs.appendFileSync(logFilePath, JSON.stringify(logEntry) + "\n", { encoding: 'utf8' });
}

app.post('/EnviarCorreo', async (req, res) => {
  try {
    const { Correo, Nombres, Puesto, pdf } = req.body;
    if (!Correo || !Nombres || !Puesto || !pdf) {
      return res.status(400).json({ error: 'Faltan campos requeridos: Correo, Nombres, Puesto, pdf' });
    }
    const pdfBuffer = Buffer.from(pdf, 'base64');
    const mailOptions = {
      from: 'ConstanciasISCITSPP@outlook.com',
      to: Correo,
      subject: 'Constancia de Participación',
      text: `Hola ${Nombres},

Buen día:
A través de este medio se le hace llegar la const<ancia de participación Innova TecNM 2025, organizado por el Instituto Tecnológico Superior De Puerto Peñasco.

Saludos.`,
      attachments: [
        {
          filename: `Constancia_${Puesto.replace(/\s/g, '_')}_${Nombres.replace(/\s/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    registrarEnvio(Correo, Nombres, Puesto, 'enviado');
    return res.status(200).json({ message: 'Correo enviado y registro guardado' });
  } catch (error) {
    console.error('Error al enviar correo:', error);
    return res.status(500).json({ error: 'Error al enviar correo' });
  }
});

app.listen(port, () => {  
  console.log(`Servidor corriendo en el puerto ${port}`);
});
