const cors = require('cors');
require('dotenv').config();
const express = require('express');
const emailapi = require('./emailapi');

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.ORIGIN,
}));

const port = process.env.SRV_PORT;

const emailProvider = new emailapi.EmailProvider({
  host: process.env.HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.ACCOUNT,
    pass: process.env.KEY,
  },
});

function hasDangerousCharacter(body) {
  if (process.env.DEVELOP) console.info('[INFO]: request body', body);
  let dangerous = false;
  Object.values(body).forEach((val) => {
    if (val.includes('<') || val.includes('>')) dangerous = true;
  });
  return dangerous;
}

async function formContactHandler(req, res) {
  // if (process.env.DEVELOP) console.debug('[DEBUG]: request headers', req.headers);
  if (!req.body) return res.send(false);
  // honeypot
  if (req.body.surname) return res.send(true);
  if (hasDangerousCharacter(req.body)) return res.send(false);
  await emailProvider.sendEmail({
    subject: 'Chiappinelli website: contact form',
    from: process.env.EMAIL_SRC,
    to: req.body.email,
    text: `Bonjour ${req.body.name},\n\nMerci pour ton message:\n"${req.body.message}"\n\nÀ bientôt,\n\nJulien ;)`,
  }, (err, info) => {
    if (process.env.DEVELOP) console.info('[INFO]: sendEmail answer:', info);
    if (err) {
      console.error('[ERROR]: sendEmail error:', process.env.DEVELOP ? err : err.code);
      return res.json({ success: false });
    }
    console.info('[INFO]: Success email sent - UTC:', new Date().toUTCString());
    return res.json({ success: true });
  });
  return false;
}

app.post('/api/form/contact', formContactHandler);
app.listen(port);

console.info('[INFO]: >>> Server listening on port', port);
