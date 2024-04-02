import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { config } from 'dotenv'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer(`💡 Example *Number Exist on Whatsapp*`)
    .addAnswer(
        '*Enter the number to check:*',
        { capture: true },
        async (ctx, { provider, flowDynamic }) => {
            const checkNumber = ctx.body
            try {
                const onWhats = await provider.vendor.onWhatsApp(checkNumber)
                if (onWhats[0]?.exists) {
                    await flowDynamic([`*Exists:* ${onWhats[0].exists}\n*JID:* ${onWhats[0].jid}`, `*Object:* ${JSON.stringify(onWhats, null, 6)}`])
                }
                else {
                    await flowDynamic(`The number *${checkNumber}* does not exists on Whatsapp.`)
                }
            } catch (error) {
                await flowDynamic(`*Error:* ${error}`);
            }
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
