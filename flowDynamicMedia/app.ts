import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { config } from 'dotenv'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER
const PORT = process.env.PORT ?? 3008

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer(`🙌 Example flowDynamic Media`)
    .addAction(
        async (ctx, { provider, flowDynamic }) => {
            await flowDynamic([{
                body: "Cocina",
                media: "https://res.cloudinary.com/dewilkinsrey/image/upload/pg_1/v1711473830/pdf/omtqdouguvkzzpsx3npy.jpg",
                delay: 1,
            }])
            // await provider.vendor.sendMessage(
            //     ctx.key.remoteJid,
            //     {
            //         document: {
            //             url: "https://edwardsib.org/ourpages/auto/2015/9/28/51403017/Cuentos%20Infantiles.pdf"
            //         },
            //         mimetype: 'application/pdf',
            //         fileName: 'myfile.pdf'
            //     }
            // )
            // await flowDynamic([
            //     {
            //         body: 'Image from URL',
            //         media: 'https://builderbot.vercel.app/_next/static/media/logo-v2.5d15651a.png'
            //     }
            // ])
            // await flowDynamic([
            //     {
            //         body: 'Video from URL',
            //         media: 'https://bot-whatsapp.netlify.app/videos/console.mp4'
            //     }
            // ])
            // await flowDynamic([
            //     {
            //         body: 'Excel file',
            //         media: './excel.xlsx'
            //     }
            // ])
            // await flowDynamic([
            //     {
            //         body: 'Word file',
            //         media: './word.docx'
            //     }
            // ])
            // await flowDynamic([
            //     {
            //         body: 'PDF file',
            //         media: './pdf.pdf'
            //     }
            // ])
            // await flowDynamic([
            //     {
            //         body: 'JSON file',
            //         media: './package.json'
            //     }
            // ])
            // await flowDynamic([
            //     {
            //         body: 'Log file',
            //         media: './baileys.log'
            //     }
            // ])
            // await flowDynamic([
            //     {
            //         body: 'MD file',
            //         media: 'README.md'
            //     }
            // ])
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
