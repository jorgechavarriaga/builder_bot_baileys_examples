import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { config } from 'dotenv'
import * as path from 'path'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER
const PORT = process.env.PORT ?? 3008

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer(`Hi!`)
    .addAction(
        async (ctx, { provider, flowDynamic }) => {
            const imagePath = 'https://www.chavazystem.tech/assets/images/EafitMechanicalEngineer.jpeg'
            // const imagePath = './src/test/jpeg.jpeg'
            // const imagePath = 'https://img.freepik.com/foto-gratis/aislado-feliz-sonriente-perro-fondo-blanco-retrato-4_1562-693.jpg'
            // const imagePath = './src/test/jpg.jpg'
            // const imagePath = 'https://builderbot.vercel.app/_next/static/media/logo-v2.5d15651a.png'
            // const imagePath = './src/test/png.png'
            await provider.sendFile(ctx.key.remoteJid, imagePath)
            await provider.sendMedia(ctx.key.remoteJid, imagePath, 'Image from sendMedia')
            await provider.vendor.sendMessage(
                ctx.key.remoteJid, {
                image: { url: imagePath },
                caption: `*Image from sendMessage*`
            })
        }
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