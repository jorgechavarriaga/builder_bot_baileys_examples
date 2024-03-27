import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { config } from 'dotenv'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER
const PORT = process.env.PORT ?? 3008

const flowInfo = addKeyword<Provider, Database>(EVENTS.ACTION)
    .addAnswer(
        'Your info:',
        null,
        async (_, { flowDynamic, state }) => {
            const data = state.getMyState()
            await flowDynamic(`*Name:* ${data.name}\n*Email:* ${data.email}`)
        }
    )

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer(`🙌 Example state`)
    .addAnswer(
        "What's your name ? ",
        { capture: true },
        async (ctx, { state }) => {
            await state.update({ name: ctx.body })
        }
    )
    .addAnswer("What's your email ? ",
        { capture: true },
        async (ctx, { state, gotoFlow }) => {
            await state.update({ email: ctx.body })
            return gotoFlow(flowInfo)
        }
    )

const main = async () => {
    const adapterFlow = createFlow([welcomeFlow, flowInfo])

    const adapterProvider = createProvider(Provider, { usePairingCode: true, phoneNumber: PHONE_NUMBER })
    const adapterDB = new Database()

    const { handleCtx, httpServer } = await createBot({ flow: adapterFlow, provider: adapterProvider, database: adapterDB, })


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
