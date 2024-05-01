import { join } from 'path'
import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'

const PORT = process.env.PORT ?? 3008
const PHONE_NUMBER = process.env.PHONE_NUMBER
const waitT = (ms: number) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(ms)
        }, ms)
    })
}

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAction(
        async (ctx, { flowDynamic, provider }) => {
            await flowDynamic(`💡 Disappearing Messages in Chat example*`)
            await provider.vendor.sendMessage(ctx?.key?.remoteJid, { disappearingMessagesInChat: 1 * 24 * 60 * 60 });
            await waitT(5000)
            await provider.vendor.sendMessage(ctx?.key?.remoteJid, { disappearingMessagesInChat: 7 * 24 * 60 * 60 });
            await waitT(5000)
            await provider.vendor.sendMessage(ctx?.key?.remoteJid, { disappearingMessagesInChat: 90 * 24 * 60 * 60 });
            await waitT(5000)
            await provider.vendor.sendMessage(ctx?.key?.remoteJid, { disappearingMessagesInChat: false });
            await waitT(5000)
            await provider.vendor.sendMessage(ctx?.key?.remoteJid, { disappearingMessagesInChat: true });
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

    adapterProvider.server.post(
        '/v1/messages',
        handleCtx(async (bot, req, res) => {
            console.log(`Api called at ${new Date()}`)
            const { number, message, urlMedia } = req.body
            await bot.sendMessage(number, message, { media: urlMedia ?? null })
            return res.end(`Message sent successfully at ${new Date()}`)
        })
    )

    adapterProvider.server.post(
        '/v1/register',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('REGISTER_FLOW', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
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
