import { addKeyword, EVENTS } from '@builderbot/bot'
import { BotContext, TFlow } from '@builderbot/bot/dist/types'

const timers = {}
const IDLETIME = 5000

function formatDate(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}` +
        ` ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
}


// Flow for handling inactivity
const idleFlow = addKeyword(EVENTS.ACTION).addAction(
    async (_, { endFlow }) => {
        return endFlow(`You have been disconnected from the BOT after  ${IDLETIME / 1000} seconds of inactivity`)
    }
)

// Function to start the inactivity timer for a user
const start = (ctx: BotContext, gotoFlow: (a: TFlow) => Promise<void>, ms: number) => {
    const nowDate: Date = new Date()
    console.log(`Timer for user ${ctx.from} - Started at:   ${formatDate(nowDate)}`)
    timers[ctx.from] = setTimeout(() => {
        const nowDate: Date = new Date()
        console.log(`Timer for user ${ctx.from} - Ended at:     ${formatDate(nowDate)}`)
        return gotoFlow(idleFlow)
    }, ms)
}

// Function to reset the inactivity timer for a user
const reset = (ctx: BotContext, gotoFlow: (a: TFlow) => Promise<void>, ms: number) => {
    stop(ctx)
    if (timers[ctx.from]) {
        const nowDate: Date = new Date()
        console.log(`Timer for user ${ctx.from} - Restarted at: ${formatDate(nowDate)}`)
        clearTimeout(timers[ctx.from])
    }
    start(ctx, gotoFlow, ms)
}

// Function to stop the inactivity timer for a user
const stop = (ctx: BotContext) => {
    const nowDate: Date = new Date()
    console.log(`Timer for user ${ctx.from} - Stopped at:   ${formatDate(nowDate)}`)
    if (timers[ctx.from]) {
        clearTimeout(timers[ctx.from])
    }
}

export {
    start,
    reset,
    stop,
    idleFlow,
    IDLETIME
}
