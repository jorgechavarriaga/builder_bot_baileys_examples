
function template(code: string) {
    const htmlTemplate = `
        <h1>
            ¡Bienvenido a WhatsApp Dolar Bot!
            <img src="https://www.chavazystem.tech/assets/images/whatsapp_dolar_bot.png" width="48" height="48" alt="WhatsApp Dolar Bot Logo" style="vertical-align: middle; border-radius: 50%;">
        </h1>
            <p>Para registrarte en WhatsApp Dolar Bot, por favor sigue estos pasos:</p>
            <ul>
            <li style="list-style-type: none;">Haz clic en el botón de abajo:</li>
            </ul>
            <a href="https://api.whatsapp.com/send/?phone=14509996155&text=j%26ee%24ASEW4MG9ce%5ESf&type=phone_number&app_absent=0">
            <button style="background-color: #4CAF50; border: none; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer; border-radius: 10px;">Registrarse</button>
            </a>
            <p>O si prefieres, puedes copiar y pegar el siguiente código en WhatsApp:</p>
            <p><strong>Código de registro:</strong> ${code}</p>
            <p>Este mensaje será enviado al número:</p>
            <p><strong>Número de WhatsApp:</strong> +1 (450) 999-6155</p>
            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en ponerte en contacto con nosotros.</p>
            <cite>Developed by <a href="https://www.chavazystem.tech">ChavaZystem Tech (®)</a></cite>
        `
    return htmlTemplate
}

export default template

