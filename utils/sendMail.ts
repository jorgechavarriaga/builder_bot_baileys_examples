import nodemailer from 'nodemailer'
import template from './emailTemplate'
import { config } from 'dotenv'
config()

const user = process.env.GMAIL_USER
const pwd = process.env.GMAIL_APP_PASSWORD
const to = 'jorge.chavarriaga@gmail.com'

async function sendEmail(code: any) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: user,
                pass: pwd,
            },
        });
        const mailOptions = {
            from: user,
            to: to,
            subject: 'Paring Code',
            html: template(code),
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('Correo enviado:', info.response);
    } catch (error) {
        console.error('Error al enviar el correo:', error);
    }
}


// sendEmail('12345');

module.exports = {
    sendEmail
}
