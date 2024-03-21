import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { config } from 'dotenv'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER
const PORT = process.env.PORT ?? 3008

interface Contact {
    id: string
    name?: string
    notify?: string
    verifiedName?: string
    imgUrl?: string
}

interface Contacts {
    [key: string]: Contact
}

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer(`🙌 Example provider Contacts`)
    .addAction(
        async (ctx, { provider, flowDynamic }) => {
            const contacts: Contacts = provider.store?.contacts
            if (contacts) {
                const sortedContacts = Object.values(contacts).sort((a, b) => {
                    const propertiesCountA = Object.values(a).filter(val => val !== undefined).length
                    const propertiesCountB = Object.values(b).filter(val => val !== undefined).length
                    return propertiesCountB - propertiesCountA
                })
                const topContacts = sortedContacts.slice(0, 5);
                const promises = topContacts.map(async (contact) => {
                    await flowDynamic(`Id: ${contact.id}\nName: ${contact.name ?? 'N/A'}\nNotify: ${contact.notify ?? 'N/A'}\nVerified Name: ${contact.verifiedName ?? 'N/A'}\nImgUrl: ${contact.imgUrl ?? 'N/A'}`);
                })
                await Promise.all(promises)
            } else {
                await flowDynamic('No contacts found.')
            }
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


    httpServer(+PORT)

    adapterProvider.http.server.post(
        '/v1/messages',
        handleCtx(async (bot, req, res) => {
            const { number, message, urlMedia } = req.body
            await bot.sendMessage(number, message, { media: urlMedia ?? null })
            return res.end('sended')
        })
    )

    adapterProvider.http.server.post(
        '/v1/register',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('REGISTER_FLOW', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.http.server.post(
        '/v1/blacklist',
        handleCtx(async (bot, req, res) => {
            const { number, intent } = req.body
            if (intent === 'remove') bot.blacklist.remove(number)
            if (intent === 'add') bot.blacklist.add(number)

            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ status: 'ok', number, intent }))
        })
    )
}

main()
