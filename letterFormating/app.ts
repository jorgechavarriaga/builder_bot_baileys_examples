import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { config } from 'dotenv'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER
const PORT = process.env.PORT ?? 3008

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer(`🙌 Example Letter Formating`)
    .addAnswer([`\`\`\`Este es un ejemplo de Monoespacio\`\`\``,
        `*Este es un ejemplo de Negrilla*`,
        `_Este es un ejemplo de Italic_`,
        `~Este es un ejemplo de Tachado~`,
        `1. List Item 1`,
        `2. List Item 2`,
        `3. List Item 3`,
        `- Bullet Item 1`,
        `- Bullet Item 2`,
        `- Bullet Item 3`,
        `> Block Quote Item 1`,
        `> Block Quote Item 2`,
        `> Block Quote Item 3`,
        `flagUsa:   \uD83C\uDDFA\uD83C\uDDF8  `,
        `flagColombia: \uD83C\uDDE8\uD83C\uDDF4`,
        `flagCanada: \uD83C\uDDE8\uD83C\uDDE6`,
        `flagEuropa: \uD83C\uDDEA\uD83C\uDDFA`,
        `flagJapon: \uD83C\uDDEF\uD83C\uDDF5`,
        `flagInglaterra: \uD83C\uDDEC\uD83C\uDDE7`,
        `flagAustralia: \uD83C\uDDE6\uD83C\uDDEE`,
        `Más fuentes en: 𝔥𝔱𝔱𝔭𝔰://𝔴𝔴𝔴.𝔠𝔥𝔞𝔳𝔞𝔷𝔶𝔰𝔱𝔢𝔪.𝔱𝔢𝔠𝔥/𝔩𝔢𝔱𝔱𝔢𝔯𝔰/𝔦𝔫𝔡𝔢𝔵.𝔥𝔱𝔪𝔩`,
        `Más fuentes en: 𝕙𝕥𝕥𝕡𝕤://𝕨𝕨𝕨.𝕔𝕙𝕒𝕧𝕒𝕫𝕪𝕤𝕥𝕖𝕞.𝕥𝕖𝕔𝕙/𝕝𝕖𝕥𝕥𝕖𝕣𝕤/𝕚𝕟𝕕𝕖𝕩.𝕙𝕥𝕞𝕝`,
        `Más fuentes en: ʜᴛᴛᴘꜱ://ᴡᴡᴡ.ᴄʜᴀᴠᴀᴢʏꜱᴛᴇᴍ.ᴛᴇᴄʜ/ʟᴇᴛᴛᴇʀꜱ/ɪɴᴅᴇx.ʜᴛᴍʟ`,
        `Más fuentes en: 𝗵𝘁𝘁𝗽𝘀://𝘄𝘄𝘄.𝗰𝗵𝗮𝘃𝗮𝘇𝘆𝘀𝘁𝗲𝗺.𝘁𝗲𝗰𝗵/𝗹𝗲𝘁𝘁𝗲𝗿𝘀/𝗶𝗻𝗱𝗲𝘅.𝗵𝘁𝗺𝗹`,
        `Más fuentes en: 𝚑𝚝𝚝𝚙𝚜://𝚠𝚠𝚠.𝚌𝚑𝚊𝚟𝚊𝚣𝚢𝚜𝚝𝚎𝚖.𝚝𝚎𝚌𝚑/𝚕𝚎𝚝𝚝𝚎𝚛𝚜/𝚒𝚗𝚍𝚎𝚡.𝚑𝚝𝚖𝚕`,
        `Más fuentes en: 𝙝𝙩𝙩𝙥𝙨://𝙬𝙬𝙬.𝙘𝙝𝙖𝙫𝙖𝙯𝙮𝙨𝙩𝙚𝙢.𝙩𝙚𝙘𝙝/𝙡𝙚𝙩𝙩𝙚𝙧𝙨/𝙞𝙣𝙙𝙚𝙭.𝙝𝙩𝙢𝙡`
    ]
    )

const main = async () => {
    const adapterFlow = createFlow([welcomeFlow])

    const adapterProvider = createProvider(Provider, { usePairingCode: true, phoneNumber: PHONE_NUMBER })
    const adapterDB = new Database()

    const { handleCtx, httpServer } = await createBot(
        {
            flow: adapterFlow,
            provider: adapterProvider,
            database: adapterDB,
        }
    )


    httpServer(+PORT)

    adapterProvider.http.server.post(
        '/v1/messages',
        handleCtx(async (bot, req, res) => {
            const { number, message, urlMedia } = req.body
            await bot.sendMessage(number, message, { media: urlMedia ?? null })
            return res.end('sended')
        })
    )

    adapterProvider.http.server.post(
        '/v1/register',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('REGISTER_FLOW', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.http.server.post(
        '/v1/blacklist',
        handleCtx(async (bot, req, res) => {
            const { number, intent } = req.body
            if (intent === 'remove') bot.blacklist.remove(number)
            if (intent === 'add') bot.blacklist.add(number)

            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ status: 'ok', number, intent }))
        })
    )
}

main()
