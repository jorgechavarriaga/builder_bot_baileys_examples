import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { MemoryDB as Database } from '@builderbot/bot'
import { config } from 'dotenv'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer(`🙌 Example poll`)
    .addAction(
        async (ctx, { provider, flowDynamic }) => {
            await flowDynamic('*Poll*')
            const number = ctx.key.remoteJid
            await provider.vendor.sendMessage(
                number, {
                poll:
                {
                    "name": "You accept terms",
                    "values": ["Yes", "No"],
                    "selectableCount": 0,
                }
            }
            )
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
