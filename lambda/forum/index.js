const nodemailer = require('nodemailer');

// HTTP response codes
function response(data) {
  return {
    isBase64Encoded: false,
    statusCode: data.error ? 400 : 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };
}

// Validation check
function hasDangerousCharacter(body) {
  let dangerous = false;
  Object.values(body).forEach((val) => {
    if (val.includes && (val.includes('<') || val.includes('>'))) dangerous = true;
  });
  return dangerous;
}

function isEmail(email) {
  const emailFormat = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  if (email !== '' && email.match(emailFormat)) return true;
  return false;
}

// Email provider class
class EmailProvider {
  constructor({ auth }) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: auth.user,
        pass: auth.pass,
      },
    });
  }

  async sendEmail(
    {
      subject, from, to, text,
    },
    callback,
  ) {
    if (!from || !to) return;
    if (!isEmail(to)) return;
    await this.transporter.sendMail({
      from,
      to,
      subject: subject || '[Pas de sujet]',
      text: text || '[Pas de contenu]', // @TODO should parse invalid char
      // html: "<b>Hello world?</b>", // html body
    }, callback);
  }
}

// Email provider instance
const emailProvider = new EmailProvider({
  auth: {
    user: process.env.ACCOUNT,
    pass: process.env.KEY,
  },
});

// Handler functions
function formERC20handler(req, callback) {
  emailProvider.sendEmail({
    subject: 'Real Estate Executive - Forum EPFL 2022: ERC20',
    from: process.env.ACCOUNT,
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
      console.log('[ERROR]: sendEmail error:', process.env.NODE_ENV === 'dev' ? err : err.code);
      callback(null, response({ success: false }));
    }
    console.info('[INFO]: Success email sent - UTC:', new Date().toUTCString());
    callback(null, response({ success: true }));
  });
}

function formNFThandler(req, callback) {
  emailProvider.sendEmail({
    subject: 'Real Estate Executive - Forum EPFL 2022: NFT',
    from: process.env.ACCOUNT,
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
      console.log('[ERROR]: sendEmail error:', process.env.NODE_ENV === 'dev' ? err : err.code);
      callback(null, response({ success: false }));
    }
    console.info('[INFO]: Success email sent - UTC:', new Date().toUTCString());
    callback(null, response({ success: true }));
  });
}

// AWS entrypoint
exports.handler = function (event, ctx, callback) {
  const { headers, queryStringParameters, body } = event;
  console.info('[INFO]: request body', body);

  if (!headers['x-csrf'] || headers['x-csrf'] !== process.env.CSRF) {
    callback(Error('Invalid parameter'));
    return;
  }
  if (!body || !queryStringParameters.target) {
    callback(Error('Invalid parameter'));
    return;
  }
  if (hasDangerousCharacter(body)) {
    callback(Error('Invalid parameter'));
    return;
  }

  if (queryStringParameters.target === 'erc20') formERC20handler({ body: JSON.parse(event.body) }, callback);
  else if (queryStringParameters.target === 'nft') formNFThandler({ body: JSON.parse(event.body) }, callback);
};
