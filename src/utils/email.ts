import nodemailer from "nodemailer";

interface ISendMailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}

const sendMail = async (options: ISendMailOptions) => {
  var transport = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    // logger: true, // Enable logging
    // debug: true, // Enable debug mode
  });

  transport.sendMail(options);
};

export default sendMail;
