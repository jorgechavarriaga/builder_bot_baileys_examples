import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { MemoryDB as Database } from '@builderbot/bot'
import { config } from 'dotenv'
import * as https from 'https';
import * as fs from 'fs'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER

async function downloadImage(imageUrl: string, localFilePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        https.get(imageUrl, (response) => {
            if (response.statusCode !== 200) {
                reject(`Error downloading the image. Status Code: ${response.statusCode}`)
                return
            }
            const fileStream = fs.createWriteStream(localFilePath)
            response.on('data', (chunk) => {
                fileStream.write(chunk)
            })
            response.on('end', () => {
                fileStream.end()
                resolve('downloaded successfully!')
            })
        }).on('error', (error) => {
            reject(`Error downloading image: ${error.message}`)
        })
    })
}

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
                const localFilePath = `./src/profilePicture/${ctx.body}.jpg`
                try {
                    const result = await downloadImage(imageProfile, localFilePath);
                    await flowDynamic(`Image ${ctx.body}.jpg ${result}`)
                } catch (error) {
                    await flowDynamic(`Error: ${error}`)
                }
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