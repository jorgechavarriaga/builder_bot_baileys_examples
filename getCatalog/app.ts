import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { LIST_ALL } from '@builderbot/bot/dist/io/events'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { Product } from '@whiskeysockets/baileys/lib/Types/Product'
import { config } from 'dotenv'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER
const number = `573043688441@s.whatsapp.net`
const PORT = process.env.PORT ?? 3008
let allProductsString = ''

const waitT = (ms: number) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(ms)
        }, ms)
    })
}

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer(`🙌 Example Catalog from Bussiness Number: ${number}`)
    .addAction(
        async (ctx, { provider, flowDynamic }) => {
            const catalogProducts = await provider.vendor.getCatalog({ jid: number })
            if (catalogProducts) {
                const listProducts: Product[] = catalogProducts.products
                allProductsString = listProducts.map((product, index) =>
                    `Name: ${product.name}\n` +
                    `URL: ${product.imageUrls.requested}\n` +
                    `URL1: ${product.imageUrls.original}\n` +
                    `Description: ${product.description}\n` +
                    `Price: ${product.currency} ${(product.price / 1000).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })} \n` +
                    `Availability: ${product.availability}\n` +
                    `Review Status: ${product.reviewStatus.whatsapp}\n` +
                    `Hidden: ${product.isHidden}\n\n`
                ).join('\n');
            }
            const list = allProductsString.split('\n\n').filter(str => str.trim() !== '')
            const promises = list.map(async (item) => {
                await flowDynamic(item)
                await waitT(2500)
            })
            await Promise.all(promises)
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
