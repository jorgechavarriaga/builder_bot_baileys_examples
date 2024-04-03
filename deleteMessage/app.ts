import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { MemoryDB as Database } from '@builderbot/bot'
import { config } from 'dotenv'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER

const waitT = (ms: number) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(ms)
        }, ms)
    })
}

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer(`💡 Example delete Message`)
    .addAction(
        async (ctx, { provider, flowDynamic }) => {
            const number = ctx.key.remoteJid
            await provider.vendor.sendMessage(number, { text: `Next message is going to be deleted in 5 seconds.\n\n*${Date()}*` })
            const msg = await provider.vendor.sendMessage(number, { text: `This is the message to be deleted!!! ` })
            await waitT(5000)
            await provider.vendor.sendMessage(number, { delete: msg.key })
            await flowDynamic(`*${Date()}*\n\nMessage has been deleted!`)
        }
    )

const main = async () => {
    const adapterFlow = createFlow([welcomeFlow])
    const adapterProvider = createProvider(Provider, { usePairingCode: true, phoneNumber: PHONE_NUMBER })
    const adapterDB = new Database()
    const botResult = await createBot(
        {
            flow: adapterFlow,
            provider: adapterProvider,
            database: adapterDB,
        }
    )
}

main()