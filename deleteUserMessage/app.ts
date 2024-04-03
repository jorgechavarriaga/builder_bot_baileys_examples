import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { MemoryDB as Database } from '@builderbot/bot'
import { config } from 'dotenv'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER

const badWords = ['fuck', 'ass hole', 'motherfucker']

const waitT = (ms: number) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(ms);
        }, ms)
    })
}

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer(`💡 Example *Delete User Message:*`)
    .addAction(
        async (ctx, { provider, flowDynamic }) => {
            const resp = ctx.body.toLocaleLowerCase()
            const containsBadWord = badWords.some(word => resp.includes(word))
            const id = ctx.key.id
            const fromMe = ctx.key.fromMe
            const timeStamp = ctx.messageTimestamp
            if (containsBadWord) {
                await flowDynamic('Your message is going to be deleted as you are sending inappropriate language.')
                await waitT(3500)
                try {
                    await provider.vendor.chatModify(
                        { clear: { messages: [{ id: id, fromMe: fromMe, timestamp: timeStamp }] } },
                        ctx.key.remoteJid
                    )
                    await flowDynamic(`Message deleted successfully.`)
                } catch (error) {
                    await flowDynamic(`Error: ${JSON.stringify(error, null, 3)}`)
                }
            }
            await flowDynamic('Welcome!')
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
