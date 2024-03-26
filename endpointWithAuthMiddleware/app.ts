import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { generateToken, verifyToken, requireAuth } from './authMiddleware'
import { config } from 'dotenv'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER
const PORT = process.env.PORT ?? 3008
const USER = process.env.user
const PWD = process.env.pwd

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME).addAnswer(`🙌 Hello welcome to this *Chatbot*`)

const sayHiFlow = addKeyword<Provider, Database>(utils.setEvent('SAY_HI'))
    .addAction(async (ctx, { flowDynamic }) => { await flowDynamic(`Hi ${ctx.name}`) })

const main = async () => {
    const adapterFlow = createFlow([welcomeFlow, sayHiFlow])
    const adapterProvider = createProvider(Provider, { usePairingCode: true, phoneNumber: PHONE_NUMBER })
    const adapterDB = new Database()
    const { handleCtx, httpServer } = await createBot({ flow: adapterFlow, provider: adapterProvider, database: adapterDB, })

    httpServer(+PORT)

    // NOTE: POST endpoint for user login and token creation
    adapterProvider.http.server.post(
        '/v1/login',
        handleCtx(async (_, req, res) => {
            const { username, password } = req.body
            // TODO: Implement user/password creation & database storage.
            if (username === USER && password === PWD) {
                const token = generateToken(username)
                res.writeHead(200, { 'Content-Type': 'application/json' })
                return res.end(JSON.stringify({ token }))
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' })
                return res.end(JSON.stringify({ message: 'Invalid credentials' }))
            }
        })
    )

    // NOTE: Post endpoint for sending messages (requires authentication and token verification)
    adapterProvider.http.server.post(
        '/v1/messages',
        requireAuth,
        verifyToken,
        handleCtx(async (bot, req, res) => {
            const { number, message, urlMedia } = req.body
            await bot.sendMessage(number, message, { media: urlMedia ?? null })
            return res.end('sended')
        })
    )

    // NOTE: Post endpoint for saying hi (requires authentication and token verification) - Triggers the sayHiFlow 
    adapterProvider.http.server.post(
        '/v1/say_hi',
        requireAuth,
        verifyToken,
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('SAY_HI', { from: number, name })
            return res.end('trigger')
        })
    )

    // NOTE: Post endpoint for managing blacklist (requires authentication and token verification)
    adapterProvider.http.server.post(
        '/v1/blacklist',
        requireAuth,
        verifyToken,
        handleCtx(async (bot, req, res) => {
            const { number, intent } = req.body
            if (intent === 'remove') bot.blacklist.remove(number)
            if (intent === 'add') bot.blacklist.add(number)
            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ status: 'ok', number, intent }))
        })
    )

    // NOTE: Post endpoint for listing blacklist numbers (requires authentication and token verification)
    adapterProvider.http.server.get(
        '/v1/listBlacklistNumbers',
        requireAuth,
        verifyToken,
        handleCtx(async (bot, _, res) => {
            const data = bot.blacklist.getList()
            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ status: 'ok', data }))
        })
    )
}

main()
