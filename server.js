// server/index.js ─ ejemplo compacto
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

// middlewares
app.use(cors());
app.use(bodyParser.json({ limit: '25mb' }));   // ↑ un poco más por si acaso

/* ───────── Mailjet API client ───────── */
const mailjet = Mailjet.apiConnect(
  process.env.MJ_API_KEY    || '***dev_key***',
  process.env.MJ_API_SECRET || '***dev_secret***'
);

/* ───────── util ───────── */
function registrarEnvio(Correo, Nombres, Puesto) {
  const line = JSON.stringify({ Correo, Nombres, Puesto, fecha: new Date().toISOString() });
  fs.appendFileSync(path.join(__dirname, 'envios.log'), line + '\n', 'utf8');
}

/* ───────── endpoint ───────── */
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
          From:    { Email: 'ConstanciasISCITSPP@outlook.com', Name: 'Constancias ISC-ITSPP' },
          To:      [{ Email: Correo, Name: Nombres }],
          Subject: 'Tu constancia de participación',
          TextPart: `Hola ${Nombres},\n\n${mensajeCorreo}\n\n¡Gracias por tu participación!`,
          Attachments: [{
            ContentType: 'application/pdf',
            Filename:    `Constancia_${Puesto.replace(/\s/g,'_')}_${Nombres.replace(/\s/g,'_')}.pdf`,
            Base64Content: pdf               // ya viene base-64 desde el front
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

/* ───────── static + fallback ───────── */
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_, res) => res.sendFile(path.join(__dirname,'dist','index.html')));

app.listen(port, () => console.log(`Servidor listo en ${port}`));
