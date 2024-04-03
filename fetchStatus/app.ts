import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { MemoryDB as Database } from '@builderbot/bot'
import { config } from 'dotenv'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer(`💡 Example *Whatsapp Status*`)
    .addAction(
        async (_, { provider, flowDynamic }) => {
            const statusInfo = await provider.vendor.fetchStatus(PHONE_NUMBER + '@s.whatsapp.net')
            console.log(statusInfo)
            await flowDynamic(`*Status Info for ${PHONE_NUMBER}*:\n\nStatus: *${statusInfo.status}*\nSet At: ${statusInfo.setAt}`)
            await flowDynamic(`Enter phone number to check status:`)
        }
    )
    .addAction(
        { capture: true },
        async (ctx, { provider, flowDynamic }) => {
            const statusR = await provider.vendor.fetchStatus(ctx.body + '@s.whatsapp.net')
            await flowDynamic(`*Status for:* ${ctx.body}\n\nStatus: *${statusR.status}*\nSet At: ${statusR.setAt}`)
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
