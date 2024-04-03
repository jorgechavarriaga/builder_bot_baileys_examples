import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { MemoryDB as Database } from '@builderbot/bot'
import { config } from 'dotenv'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER
let contacts = {}

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer(`💡 Example *Contacts on BOT*`)
    .addAction(
        async (_, { flowDynamic }) => {
            const contactsBot = Object.entries(contacts)
                .filter(([id, _]) => id.includes('@s.whatsapp.net'))
                .map(([id, data]) => ({ id, name: data }))
            await flowDynamic(`Total contacts: ${contactsBot.length}`)
            const messages: string[] = []
            for (const grupo of contactsBot) {
                const message = `${grupo.name ? 'Object:' : ''} ${JSON.stringify(grupo?.name, null, 5) || ''}\n*id:* ${grupo.id}`
                messages.push(message);
            }
            const concatenatedMessages = messages.join('\n\n')
            await flowDynamic(concatenatedMessages);
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

    try {
        adapterProvider.on("ready", () => {
            adapterProvider.store
            if (adapterProvider.store && adapterProvider.store.contacts) {
                contacts = adapterProvider.store.contacts
            }
        })
    } catch (error) {
        console.log(error)
    }
}

main()
