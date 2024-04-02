import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { generate_joke } from './services/get_joke'
import { config } from 'dotenv'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer(`💡 Example *EXTERNAL API Call*`)
    .addAnswer(
        '*Here\'s a Joke from the API:*',
        null,
        async (_, { flowDynamic }) => {
            const { joke, delivery, error, message } = await generate_joke()
            if (!error) {
                if (delivery) {
                    await flowDynamic(joke)
                    await flowDynamic(delivery, { delay: 5000 })
                } else {
                    await flowDynamic(joke)
                }
            } else {
                await flowDynamic(`Error: ${message}`)
            }
        }
    )

const main = async () => {
    const adapterFlow = createFlow([welcomeFlow])
    const adapterProvider = createProvider(Provider, { usePairingCode: true, phoneNumber: PHONE_NUMBER })
    const adapterDB = new Database()
    const botResult = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

}

main()
