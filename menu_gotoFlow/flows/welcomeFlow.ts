import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { MemoryDB as Database } from '@builderbot/bot'
import { addKeyword, EVENTS } from '@builderbot/bot'
import option1 from './flowOption1'
import option2 from './flowOption2'


const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer(`🙌 Example gotoFlow\nSelect an option:`)
    .addAnswer(
        ['M̲e̲n̲u̲\n', 'Option 1 - Date ', 'Option 2 - Time ', 'Option 3 - End'],
        { capture: true },
        async (ctx, { gotoFlow, fallBack, endFlow }) => {
            const option: string = ctx.body
            switch (option) {
                case "1":
                    return gotoFlow(option1)
                case "2":
                    return gotoFlow(option2)
                case "3":
                    return endFlow('Bot ended.')
                default:
                    return fallBack(`❌ Option ${option} is not valid! ❌`)
            }
        }
    )

export default welcomeFlow