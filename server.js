// server.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Mailjet from 'node-mailjet';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const port = process.env.PORT || 3000;

// ───────── middlewares ─────────
app.use(cors());
app.use(bodyParser.json({ limit: '25mb' }));

// ───────── Mailjet API client ─────────
const mailjet = Mailjet.apiConnect(
  process.env.MJ_API_KEY    || '***dev_key***',
  process.env.MJ_API_SECRET || '***dev_secret***'
);

// ───────── util ─────────
function registrarEnvio(Correo, Nombres, Puesto) {
  const entrada = { Correo, Nombres, Puesto, fecha: new Date().toISOString() };
  fs.appendFileSync(
    path.join(__dirname, 'envios.log'),
    JSON.stringify(entrada) + '\n',
    'utf8'
  );
}

// ───────── endpoint: enviar correo ─────────
app.post('/EnviarCorreo', async (req, res) => {
  try {
    const { Correo, Nombres, Puesto, pdf, mensajeCorreo } = req.body;
    if (!Correo || !Nombres || !Puesto || !pdf || !mensajeCorreo) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    await mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [{
          From: {
            Email: 'ConstanciasISCITSPP@outlook.com',
            Name:  'Constancias ISC-ITSPP'
          },
          To: [{
            Email: Correo,
            Name:  Nombres
          }],
          Subject:  'Tu constancia de participación',
          TextPart: `Hola ${Nombres},\n\n${mensajeCorreo}\n\n¡Gracias por tu participación!`,
          Attachments: [{
            ContentType:   'application/pdf',
            Filename:      `Constancia_${Puesto.replace(/\s/g,'_')}_${Nombres.replace(/\s/g,'_')}.pdf`,
            Base64Content: pdf
          }]
        }]
      });

    registrarEnvio(Correo, Nombres, Puesto);
    return res.json({ message: 'Correo enviado y registro guardado' });
  } catch (err) {
    console.error('Mailjet error →', err.statusCode || err);
    return res.status(500).json({ error: 'Error al enviar correo' });
  }
});

// ───────── servir el build de Vite ─────────
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// ───────── fallback para SPA (¡sin usar path-to-regexp!) ─────────
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ───────── arranque ─────────
app.listen(port, () => {
  console.log(`Servidor listo en ${port}`);
});
