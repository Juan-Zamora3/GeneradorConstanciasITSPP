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

// Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Transporter Mailjet
const transporter = nodemailer.createTransport({
  host: 'in-v3.mailjet.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.MJ_USER  || '9cc11f30814a33827038897d882171ba',
    pass: process.env.MJ_PASS  || '6f62026af89ac6862ab83c53768b8a2a'
  }
});

// Función de logging
function registrarEnvio(Correo, Nombres, Puesto) {
  const entry = { Correo, Nombres, Puesto, fecha: new Date().toISOString() };
  fs.appendFileSync(path.join(__dirname, 'envios.log'),
                    JSON.stringify(entry) + "\n",
                    'utf8');
}

// API endpoint
app.post('/EnviarCorreo', async (req, res) => {
  try {
    const { Correo, Nombres, Puesto, pdf } = req.body;
    if (!Correo || !Nombres || !Puesto || !pdf) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    const pdfBuffer = Buffer.from(pdf, 'base64');
    await transporter.sendMail({
      from: 'ConstanciasISCITSPP@outlook.com',
      to: Correo,
      subject: 'Constancia de Participación',
      text: `Hola ${Nombres},

Buen día:
A través de este medio se le hace llegar la constancia de participación Innova TecNM 2025.

Saludos.`,
      attachments: [{
        filename: `Constancia_${Puesto.replace(/\s/g,'_')}_${Nombres.replace(/\s/g,'_')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });
    registrarEnvio(Correo, Nombres, Puesto);
    res.json({ message: 'Correo enviado y registro guardado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al enviar correo' });
  }
});

// 1) Sirve estáticos de Vite build
app.use(express.static(path.join(__dirname, 'dist')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
// 3) Arranca servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
