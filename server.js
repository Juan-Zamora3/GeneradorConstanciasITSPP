/* eslint-env node */
// server.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Mailjet from 'node-mailjet';
import dotenv from 'dotenv';
// import helmet from 'helmet';
// import compression from 'compression';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
// En Render, PORT lo define la plataforma
const port = process.env.PORT || 4000;

/* =========================
   Middlewares
========================= */
const frontOrigin = process.env.FRONT_ORIGIN; // ej: https://tu-front.onrender.com
app.use(cors(frontOrigin ? { origin: frontOrigin } : undefined));
app.use(bodyParser.json({ limit: '50mb' }));
// app.use(helmet());
// app.use(compression());

/* =========================
   Mailjet
========================= */
const MJ_KEY    = process.env.MJ_API_KEY    || '';
const MJ_SECRET = process.env.MJ_API_SECRET || '';
if (!MJ_KEY || !MJ_SECRET) {
  console.warn('⚠️  MJ_API_KEY / MJ_API_SECRET no configurados. El envío de correo fallará.');
}
const mailjet   = Mailjet.apiConnect(MJ_KEY, MJ_SECRET);

const senderEmail = process.env.MJ_SENDER || 'ConstanciasISCITSPP@outlook.com';
const senderName  = process.env.MJ_SENDER_NAME || 'Constancias ISC-ITSPP';

/* =========================
   Utils
========================= */
function registrarEnvio(entry) {
  const linea = { ...entry, fecha: new Date().toISOString() };
  try {
    if (process.env.NODE_ENV === 'production') {
      console.log('[ENVIO]', linea);
    } else {
      fs.appendFileSync(path.join(__dirname, 'envios.log'), JSON.stringify(linea) + '\n', 'utf8');
    }
  } catch (e) {
    console.error('No se pudo registrar el envío:', e.message);
  }
}

function approxBase64Bytes(b64) {
  // base64 añade ~33%
  return Math.floor((b64.length * 3) / 4);
}

/* =========================
   Healthcheck
========================= */
app.get('/health', (_req, res) => res.json({ ok: true }));

/* =========================
   POST /EnviarCorreo
   - Enviar 1 adjunto (por persona)
   - Por defecto PDF, pero acepta Filename/ContentType para ser flexible
========================= */
app.post('/EnviarCorreo', async (req, res) => {
  try {
    const {
      Correo,
      Nombres,
      Puesto,
      pdf,                 // contenido base64
      mensajeCorreo,
      Asunto,
      Filename,            // opcional
      ContentType          // opcional (default application/pdf)
    } = req.body;

    if (!Correo || !Nombres || !Puesto || !pdf || !mensajeCorreo) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const size = approxBase64Bytes(pdf);
    if (size > 15 * 1024 * 1024) {
      return res.status(413).json({ error: 'Adjunto demasiado grande' });
    }

    const filename = Filename || `Constancia_${String(Puesto).replace(/\s/g,'_')}_${String(Nombres).replace(/\s/g,'_')}.pdf`;
    const contentType = ContentType || 'application/pdf';

    const request = await mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [{
          From: { Email: senderEmail, Name: senderName },
          To: [{ Email: Correo, Name: Nombres }],
          Subject: Asunto || 'Tu constancia de participación',
          TextPart: `Hola ${Nombres},\n\n${mensajeCorreo}\n\n¡Gracias por tu participación!`,
          Attachments: [{
            ContentType: contentType,
            Filename: filename,
            Base64Content: pdf
          }]
        }]
      });

    const messageId = request?.body?.Messages?.[0]?.To?.[0]?.MessageID || null;
    registrarEnvio({ tipo: contentType === 'application/zip' ? 'zip' : 'pdf', Correo, Nombres, Puesto, filename, messageId });
    return res.json({ message: 'Correo enviado', messageId });
  } catch (err) {
    const code = err?.statusCode || 500;
    const detail = err?.response?.text || err?.message || 'Error al enviar correo';
    console.error('Mailjet error →', code, detail);
    return res.status(500).json({ error: 'Error al enviar correo', detail });
  }
});

/* =========================
   POST /EnviarZip
   - Alternativa explícita para ZIP por equipos
   - Si prefieres, puedes mandar ZIP también por /EnviarCorreo con ContentType/Filename
========================= */
app.post('/EnviarZip', async (req, res) => {
  try {
    const { Correo, Nombres, mensajeCorreo, zipBase64, filename, Asunto } = req.body;
    if (!Correo || !Nombres || !mensajeCorreo || !zipBase64 || !filename) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const size = approxBase64Bytes(zipBase64);
    if (size > 20 * 1024 * 1024) {
      return res.status(413).json({ error: 'ZIP demasiado grande para enviar por correo' });
    }

    const request = await mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [{
          From: { Email: senderEmail, Name: senderName },
          To: [{ Email: Correo, Name: Nombres }],
          Subject: Asunto || 'Constancias del equipo',
          TextPart: `Hola ${Nombres},\n\n${mensajeCorreo}\n\nSaludos.`,
          Attachments: [{
            ContentType: 'application/zip',
            Filename: filename,
            Base64Content: zipBase64
          }]
        }]
      });

    const messageId = request?.body?.Messages?.[0]?.To?.[0]?.MessageID || null;
    registrarEnvio({ tipo: 'zip', Correo, Nombres, filename, messageId });
    return res.json({ message: 'ZIP enviado', messageId });
  } catch (err) {
    const code = err?.statusCode || 500;
    const detail = err?.response?.text || err?.message || 'Error al enviar correo';
    console.error('Mailjet error (ZIP) →', code, detail);
    return res.status(500).json({ error: 'Error al enviar ZIP', detail });
  }
});

/* =========================
   Static (build Vite)
========================= */
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

/* =========================
   Start
========================= */
app.listen(port, () => {
  console.log(`Servidor listo en ${port}`);
});
