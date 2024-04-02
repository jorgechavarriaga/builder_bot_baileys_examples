import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { config } from 'dotenv'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer(`💡 Example *List Blocked Users on BOT:*`)
    .addAction(
        async (_, { provider, flowDynamic }) => {
            const blocked = await provider.vendor.fetchBlocklist()
            const result = blocked.map((id, index) => `id ${index + 1}: ${id}`).join('\n');
            await flowDynamic(`*Blocked:*\n${result}`)
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
