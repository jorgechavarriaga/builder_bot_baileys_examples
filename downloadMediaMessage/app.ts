import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { MemoryDB as Database } from '@builderbot/bot'
import { writeFile } from 'fs/promises'
import { config } from 'dotenv'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER
const PORT = process.env.PORT ?? 3008

function getExtension(mimeType) {
    if (!mimeType || typeof mimeType !== 'string' || !mimeType.includes('/')) { return 'unknown' }
    const parts = mimeType.split('/');
    if (parts.length === 2) {
        let extension = parts[1];
        if (extension.endsWith('.sheet')) { extension = 'xlsx' }
        else if (extension.endsWith('.document')) { extension = 'docx' }
        else if (extension.endsWith('.presentation')) { extension = 'pptx' }
        return extension
    } else { return 'unknown' }
}

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer(`🙌 Example Download Media Message`)
    .addAnswer('Please send a file:')
    .addAction(
        async (_, { provider, flowDynamic }) => {
            try {
                provider.vendor.ev.on('messages.upsert', async ({ messages }) => {
                    const m = messages[0]
                    if (!m.message) return
                    const messageType = Object.keys(m.message)[0]
                    let mimeType: any
                    let type: string
                    let fileName: any
                    if (messages[0]?.message?.imageMessage?.mimetype) {
                        mimeType = messages[0].message.imageMessage.mimetype
                        type = 'imageMessage'
                    } else if (messages[0]?.message?.documentMessage?.mimetype) {
                        mimeType = messages[0].message.documentMessage.mimetype
                        fileName = messages[0].message.documentMessage.fileName
                        type = 'documentMessage'
                    } else if (messages[0]?.message?.videoMessage?.mimetype) {
                        mimeType = messages[0].message.videoMessage.mimetype
                        type = 'videoMessage'
                    } else {
                        mimeType = 'Unknown file'
                    }
                    const ext = getExtension(mimeType)
                    if (messageType === type) {
                        const buffer = await downloadMediaMessage(m, 'buffer', {}, {
                            reuploadRequest: provider.vendor.updateMediaMessage,
                            logger: undefined
                        })
                        const now = new Date()
                        fileName = fileName ?? `${type}.${ext}`
                        await writeFile(`./src/downloadMediaMessage/media/${fileName}`, buffer)
                    }
                })
            } catch (error) {
                console.log(`Error: ${error}`)
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
