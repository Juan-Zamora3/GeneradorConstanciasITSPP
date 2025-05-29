import express from 'express';
import nodemailer from 'nodemailer';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));

const transporter = nodemailer.createTransport({
  host: 'in-v3.mailjet.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.MJ_USER  || '9cc11f30814a33827038897d882171ba',
    pass: process.env.MJ_PASS  || '6f62026af89ac6862ab83c53768b8a2a'
  }
});

function registrarEnvio(Correo, Nombres, Puesto) {
  const entry = { Correo, Nombres, Puesto, fecha: new Date().toISOString() };
  fs.appendFileSync(
    path.join(__dirname, 'envios.log'),
    JSON.stringify(entry) + "\n",
    'utf8'
  );
}

app.post('/EnviarCorreo', async (req, res) => {
  try {
    const { Correo, Nombres, Puesto, pdf, mensajeCorreo } = req.body;
    if (!Correo || !Nombres || !Puesto || !pdf || !mensajeCorreo) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    const pdfBuffer = Buffer.from(pdf, 'base64');

    await transporter.sendMail({
      from: 'ConstanciasISCITSPP@outlook.com',
      to: Correo,
      subject: 'Tu constancia de participación',
      text: `Hola ${Nombres},\n\n${mensajeCorreo}\n\n¡Gracias por tu participación!`,
      attachments: [{
        filename: `Constancia_${Puesto.replace(/\s/g,'_')}_${Nombres.replace(/\s/g,'_')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });

    registrarEnvio(Correo, Nombres, Puesto);
    return res.json({ message: 'Correo enviado y registro guardado' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al enviar correo' });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
