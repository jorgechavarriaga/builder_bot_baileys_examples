import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { MemoryDB as Database } from '@builderbot/bot'
import { config } from 'dotenv'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER

const flowPrincipal = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAction(
        async (_, { flowDynamic }) => {
            await flowDynamic('💡 Mark Messages as \nWhat\'s your name?')

        })
    .addAction(
        { capture: true },
        async (ctx, { flowDynamic, provider }) => {
            await flowDynamic(`Your name ${ctx.body} is marked as read.`)
            await provider.vendor.readMessages([ctx.key])
        })

const main = async () => {
    const adapterFlow = createFlow([flowPrincipal])
    const adapterProvider = createProvider(Provider, { usePairingCode: true, phoneNumber: PHONE_NUMBER })
    const adapterDB = new Database()
    const bot = await createBot(
        {
            flow: adapterFlow,
            provider: adapterProvider,
            database: adapterDB,
        }
    )
}

main()
