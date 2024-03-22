import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { config } from 'dotenv'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER
const PORT = process.env.PORT ?? 3008

const badWords = ['fuck', 'ass hole', 'motherfucker']

const waitT = (ms: number) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(ms);
        }, ms)
    })
}

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer(`🙌 Example Test:`)
    .addAction(
        async (ctx, { provider, flowDynamic, endFlow }) => {
            const resp = ctx.body.toLocaleLowerCase()
            const containsBadWord = badWords.some(word => resp.includes(word))
            const id = ctx.key.id
            const fromMe = ctx.key.fromMe
            const timeStamp = ctx.messageTimestamp
            if (containsBadWord) {
                await flowDynamic('Your message is going to be deleted as you are sending inappropriate language.')
                await waitT(3500)
                try {
                    await provider.vendor.chatModify(
                        { clear: { messages: [{ id: id, fromMe: fromMe, timestamp: timeStamp }] } },
                        ctx.key.remoteJid
                    )
                    await flowDynamic(`Message deleted successfully.`)
                    return endFlow('Bye !!!')
                } catch (error) {
                    await flowDynamic(`Error: ${JSON.stringify(error, null, 3)}`)
                }
            }
            await flowDynamic('Welcome!')
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
