import FormData from "form-data"; // form-data v4.0.1
import Mailgun from "mailgun.js"; // mailgun.js v11.1.0

const to = process.env.TO_EMAIL ? JSON.parse(process.env.TO_EMAIL) : [];
async function sendSimpleMessage(subject, message) {
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key: process.env.MAIL_API_KEY,
    // When you have an EU-domain, you must specify the endpoint:
    // url: "https://api.eu.mailgun.net/v3"
  });
  try {
    const data = await mg.messages.create(
      "sandbox744089a6d4524956a024b13e1969273a.mailgun.org",
      {
        from: process.env.FROM_EMAIL,
        to: to,
        subject: subject,
        text: message,
      }
    );
    console.log("success!");

    console.log(data); // logs response data
  } catch (error) {
    console.log("error :(");
    console.log(error); //logs any error
  }
}
sendSimpleMessage();
