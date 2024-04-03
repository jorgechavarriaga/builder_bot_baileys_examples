import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { MemoryDB as Database } from '@builderbot/bot'
import { config } from 'dotenv'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer(`💡 Example *profile Picture*`)
    .addAnswer(
        'Enter number to check image profile: ', { capture: true },
        async (ctx, { provider, flowDynamic, fallBack }) => {
            const check = ctx.body + '@s.whatsapp.net'
            try {
                const imageProfile = await provider.vendor.profilePictureUrl(check.replace(/\+/g, ''), 'image', 10000)
                await flowDynamic([
                    {
                        body: `*${check} Profile Picture* 👆🏻👆🏻👆🏻 `,
                        media: imageProfile
                    }
                ])
            } catch (error) {
                await flowDynamic(`Error: ${error.message}`)
                return fallBack('Try it again.')
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