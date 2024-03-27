import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { config } from 'dotenv'
import * as path from 'path'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER
const PORT = process.env.PORT ?? 3008

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer(`sendMessage Example:`)
    .addAction(
        async (ctx, { provider }) => {
            await provider.vendor.sendMessage(ctx.key.remoteJid, { text: 'Text Message! ' })
            await provider.vendor.sendMessage(
                ctx.key.remoteJid,
                {
                    text: 'Message via ad',
                    contextInfo: {
                        externalAdReply: {
                            title: 'Catalog',
                            body: 'Akerale',
                            mediaType: 1, // COMMENTS: 0 None, 1 Image, 2 Video
                            showAdAttribution: false, // COMMENTS: 'Message via ad' 
                            renderLargerThumbnail: false,
                            mediaUrl: 'http://www.akelare.com/cdn/shop/files/agua-micelar-rosas-y-pepino_25beb8d9-325c-46c4-a32a-3ecb16a37c5f_1200x1200.jpg',
                            thumbnailUrl: 'http://www.akelare.com/cdn/shop/files/agua-micelar-rosas-y-pepino_25beb8d9-325c-46c4-a32a-3ecb16a37c5f_1200x1200.jpg',
                            sourceUrl: 'https://wa.me/c/573043688441',
                        }
                    }

                })
            await provider.vendor.sendMessage(
                ctx.key.remoteJid, {
                image: { url: 'https://www.chavazystem.tech/assets/images/EafitMechanicalEngineer.jpeg' },
                caption: `*Image URL from sendMessage*`
            })
            await provider.vendor.sendMessage(
                ctx.key.remoteJid, {
                image: { url: './src/sendMessage/jpg.jpg' },
                caption: `*Image Local from sendMessage*`
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