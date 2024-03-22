import { addKeyword, EVENTS } from '@builderbot/bot'

const Test = addKeyword(EVENTS.ACTION)
    .addAnswer(`Test Flow`)
    .addAction(
        async (ctx, { flowDynamic }) => {
            await flowDynamic([
                {
                    body: 'Body Text',
                    media: 'media.jpg'
                }
            ])
            await flowDynamic('Some text')
        }
    )

export default Test