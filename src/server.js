const cors = require('cors');
require('dotenv').config();
const express = require('express');
const emailapi = require('./emailapi');

const app = express();
app.use(express.json());
// app.use(cors({
//   origin: process.env.ORIGIN,
// }));

const port = process.env.SRV_PORT;

const emailProvider = new emailapi.EmailProvider({
  auth: {
    user: process.env.ACCOUNT,
    pass: process.env.KEY,
  },
});

function hasDangerousCharacter(body) {
  let dangerous = false;
  Object.values(body).forEach((val) => {
    if (val.includes && (val.includes('<') || val.includes('>'))) dangerous = true;
  });
  return dangerous;
}

async function formContactHandler(req, res) {
  // honeypot
  if (req.body.surname) return res.send(true);
  await emailProvider.sendEmail({
    subject: 'Website: contact form',
    from: process.env.EMAIL_SRC,
    to: req.body.email,
    text: `Bonjour ${req.body.name},\n\nMerci pour ton message:\n"${req.body.message}"\n\nÀ bientôt,\n\nJulien ;)`,
  }, (err, info) => {
    if (process.env.NODE_ENV === 'dev') console.info('[INFO]: sendEmail answer:', info);
    if (err) {
      console.error('[ERROR]: sendEmail error:', process.env.NODE_ENV === 'dev' ? err : err.code);
      return res.json({ success: false });
    }
    console.info('[INFO]: Success email sent - UTC:', new Date().toUTCString());
    return res.json({ success: true });
  });
  return false;
}

async function formERC20handler(req, res) {
  await emailProvider.sendEmail({
    subject: 'Real Estate Executive - Forum EPFL 2022: ERC20',
    from: process.env.EMAIL_SRC,
    to: req.body.email,
    text: `Congrats !

You just created your own cryptocurrency on Mumbai Polygon Chain !

Token: ${req.body.name}
Symbol: ${req.body.symbol}

You can visit the blockchain explorer here: ${req.body.explorerLink}

See you soon !

Real Executive Dev Team`,
  }, (err, info) => {
    if (process.env.NODE_ENV === 'dev') console.info('[INFO]: sendEmail answer:', info);
    if (err) {
      console.error('[ERROR]: sendEmail error:', process.env.NODE_ENV === 'dev' ? err : err.code);
      return res.json({ success: false });
    }
    console.info('[INFO]: Success email sent - UTC:', new Date().toUTCString());
    return res.json({ success: true });
  });
  return false;
}

async function formNFThandler(req, res) {
  await emailProvider.sendEmail({
    subject: 'Real Estate Executive - Forum EPFL 2022: NFT',
    from: process.env.EMAIL_SRC,
    to: req.body.email,
    text: `Congrats !

You just created your own NFT on Mumbai Polygon Chain.

NFT name: ${req.body.name}
NFT description: ${req.body.description}

You can visit the blockchain explorer for the transaction here: ${req.body.explorerLink}

You can access the NFT marketplace on Opensea here: ${req.body.marketPlace}

You can access your NFT data on IPFS gateways or browser (like brave) here: ${req.body.ipfsUrl}

See you soon !

Real Executive Dev Team`,
  }, (err, info) => {
    if (process.env.NODE_ENV === 'dev') console.info('[INFO]: sendEmail answer:', info);
    if (err) {
      console.error('[ERROR]: sendEmail error:', process.env.NODE_ENV === 'dev' ? err : err.code);
      return res.json({ success: false });
    }
    console.info('[INFO]: Success email sent - UTC:', new Date().toUTCString());
    return res.json({ success: true });
  });
  return false;
}

async function formHandler(req, res) {
  if (process.env.NODE_ENV === 'dev') console.debug('[DEBUG]: request headers', req.headers);
  console.info('[INFO]: request body', req.body);
  if (!req.body) return res.send(false);
  if (hasDangerousCharacter(req.body)) return res.send(false);

  const { url } = req;
  if (url === '/api/form/contact') return formContactHandler(req, res);
  if (url === '/api/forum/erc20') return formERC20handler(req, res);
  if (url === '/api/forum/nft') return formNFThandler(req, res);
  return res.send(false);
}

app.post('/api/form/contact', formHandler);
app.post('/api/forum/erc20', formHandler);
app.post('/api/forum/nft', formHandler);
const server = app.listen(port);
server.setTimeout(20000);

console.info('[INFO]: >>> Server listening on port', port);
