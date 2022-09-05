const nodemailer = require('nodemailer');

function isEmail(email) {
  const emailFormat = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  if (email !== '' && email.match(emailFormat)) return true;
  return false;
}

class EmailProvider {
  constructor({
    service, host, port, auth, secure = true,
  }) {
    this.transporter = null;
    nodemailer.createTestAccount()
      .then((testAccount) => {
        const options = {
          secure, // true for 465, false for other ports
          auth: auth || {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        };
        if (service) {
          options.service = service;
        } else {
          options.host = host || testAccount.imap.host;
          options.port = port || testAccount.imap.port;
        }
        this.transporter = nodemailer.createTransport(options);
      })
      .catch((err) => {
        if (process.env.DEVELOP === 'dev') console.error('[ERROR]: Creating mailer instance', err);
        else console.error('[ERROR]: Creating mailer instance');
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
    this.transporter.sendMail({
      from,
      to,
      subject: subject || '[Pas de sujet]',
      text: text || '[Pas de contenu]', // @TODO should parse invalid char
      // html: "<b>Hello world?</b>", // html body
    }, callback);
  }
}

module.exports = {
  EmailProvider,
};
