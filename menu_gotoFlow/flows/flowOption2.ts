import { addKeyword, EVENTS } from '@builderbot/bot'
import welcomeFlow from './welcomeFlow'
import option1 from './flowOption1'
import moment from 'moment'

const now = moment().format('HH:MM:ss')

const option2 = addKeyword(EVENTS.ACTION)
    .addAnswer(`*Time:* ${now}`)
    .addAnswer(['Select an option:\n\n*SubMenu 2*\n', '1 Go back', '2 Go to SubMenu 1', '3 End'])
    .addAction(
        { capture: true },
        async (ctx, { gotoFlow, endFlow, fallBack }) => {
            const resp = ctx.body
            if (resp === "1") {
                return gotoFlow(welcomeFlow)
            } else if (resp === "2") {
                return gotoFlow(option1)
            } else if (resp === "3") {
                return endFlow('End')
            } else {
                return fallBack(`Option ${resp} is not valid, try it again.`)
            }
        }
    )

export default option2