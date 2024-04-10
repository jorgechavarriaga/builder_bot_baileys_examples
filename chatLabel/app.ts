import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { config } from 'dotenv'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER
const PORT = process.env.PORT ?? 3008

const waitT = (ms: number) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(ms)
        }, ms)
    })
}

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer(`💡 Example Label`)
    .addAnswer(
        'What\'s your name ?',
        { capture: true },
        async (ctx, { provider, flowDynamic }) => {
            await provider.vendor.chatModify(
                {
                    addChatLabel: {
                        //NOTE labelId: '2' New Order
                        //NOTE labelId: '3' Pending Payment
                        //NOTE labelId: '4' Paid
                        //NOTE labelId: '5' Order Complete
                        //NOTE labelId: '6' Important
                        //NOTE labelId: '7' Follow up
                        //NOTE labelId: '8' Lead
                        //NOTE labelId: '9' URGENT CALL (added previusly on whatsapp bussiness)
                        labelId: '9'
                    }
                }, ctx.key.remoteJid
            )
            await flowDynamic(`Chat labeled as *URGENT CALL*`)
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
