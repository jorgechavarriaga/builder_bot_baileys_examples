import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { createBot, createProvider, createFlow } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import welcomeFlow from './flows/welcomeFlow'
import option1 from './flows/flowOption1'
import option2 from './flows/flowOption2'

import { config } from 'dotenv'
config()

const PHONE_NUMBER = process.env.PHONE_NUMBER

const main = async () => {
    const adapterFlow = createFlow([welcomeFlow, option1, option2])
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

