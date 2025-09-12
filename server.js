// server.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Mailjet from 'node-mailjet';
// opcional
// import helmet from 'helmet';
// import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: '25mb' }));
// app.use(helmet());
// app.use(compression());

// Mailjet
const MJ_KEY = process.env.MJ_API_KEY;
const MJ_SECRET = process.env.MJ_API_SECRET;

if (!MJ_KEY || !MJ_SECRET) {
  console.warn('⚠️ Falta MJ_API_KEY/MJ_API_SECRET en variables de entorno.');
}
const mailjet = Mailjet.apiConnect(MJ_KEY || '***dev_key***', MJ_SECRET || '***dev_secret***');

// Utils
function registrarEnvio(Correo, Nombres, Puesto) {
  const entrada = { Correo, Nombres, Puesto, fecha: new Date().toISOString() };
  if (process.env.NODE_ENV === 'production') {
    console.log('[ENVIO]', entrada);
  } else {
    fs.appendFileSync(path.join(__dirname, 'envios.log'), JSON.stringify(entrada) + '\n', 'utf8');
  }
}

// API
app.post('/EnviarCorreo', async (req, res) => {
  try {
    const { Correo, Nombres, Puesto, pdf, mensajeCorreo } = req.body;
    if (!Correo || !Nombres || !Puesto || !pdf || !mensajeCorreo) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Límite conservador para adjunto
    const approxBytes = (pdf.length * 3) / 4;
    if (approxBytes > 10 * 1024 * 1024) {
      return res.status(413).json({ error: 'PDF demasiado grande para enviar por correo' });
    }

    await mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [{
          From: { Email: 'ConstanciasISCITSPP@outlook.com', Name: 'Constancias ISC-ITSPP' },
          To: [{ Email: Correo, Name: Nombres }],
          Subject: 'Tu constancia de participación',
          TextPart: `Hola ${Nombres},\n\n${mensajeCorreo}\n\n¡Gracias por tu participación!`,
          Attachments: [{
            ContentType: 'application/pdf',
            Filename: `Constancia_${Puesto.replace(/\s/g,'_')}_${Nombres.replace(/\s/g,'_')}.pdf`,
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

// Healthcheck
app.get('/health', (_req, res) => res.json({ ok: true }));

// Static
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback SPA SOLO GET
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor listo en ${port}`);
});
