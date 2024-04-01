import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { MemoryDB as Database } from '@builderbot/bot'
import { idleFlow, reset, start, stop, IDLETIME } from '../idleCasero/idle-custom'
import { config } from 'dotenv'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER
const PORT = process.env.PORT ?? 3008

const finalFlow = addKeyword<Provider, Database>(EVENTS.ACTION)
    .addAction(
        async (_, { endFlow }) => {
            return endFlow('End by inactivity')
        }
    )

const multiFlow = addKeyword<Provider, Database>(EVENTS.ACTION)
    .addAction(async (ctx, { gotoFlow }) => start(ctx, gotoFlow, IDLETIME))
    .addAnswer(`You have ${IDLETIME / 1000} seconds to respond\n*Multiplication:*\n6 * 6 ?`)
    .addAction(
        { capture: true },
        async (ctx, { flowDynamic, gotoFlow, fallBack, endFlow }) => {
            const resp = ctx.body
            if (resp === "36") {
                stop(ctx)
                await flowDynamic(`You are right!`)
                return endFlow(`That's all!`)
            } else {
                reset(ctx, gotoFlow, IDLETIME)
                return fallBack('Wrong answer, try it again!')
            }
        }
    )


const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer(`🙌 *Example Idle*\n\nYou have ${IDLETIME / 1000} seconds to respond`)
    .addAction(async (ctx, { gotoFlow }) => start(ctx, gotoFlow, IDLETIME))
    .addAnswer(
        "1 + 1 ?",
        { capture: true },
        async (ctx, { flowDynamic, gotoFlow, fallBack }) => {
            const resp = ctx.body
            if (resp === "2") {
                stop(ctx)
                await flowDynamic(`You are right!`)
                return gotoFlow(multiFlow)
            } else {
                reset(ctx, gotoFlow, IDLETIME)
                return fallBack('Wrong answer, try it again!')
            }
        }
    )


const main = async () => {
    const adapterFlow = createFlow([welcomeFlow, finalFlow, multiFlow, idleFlow])

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
