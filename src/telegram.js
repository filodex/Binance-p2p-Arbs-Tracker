/**
 * telegram.js по айди в конфиге отправит сообщение
 */

import { Telegraf } from 'telegraf'
import { writeFile, readFileSync } from 'fs'
import chalk from 'chalk'

let botToken

try {
    botToken = readFileSync('./src/token.txt')
} catch (error) {
    console.log(
        chalk.bgRed(
            'Please create token.txt in /src, and add your bot token there.'
        )
    )
    process.exit(0)
}
const bot = new Telegraf(botToken)

bot.launch()
console.log(chalk.bgGreen('Bot started'))

// subscribers
let subscribers = JSON.parse(readFileSync('./src/subscribers.json'))
console.log(`Loaded subscribers: ${subscribers}`)

bot.hears('id', async (ctx) => {
    ctx.reply(await ctx.getChat().id)
})

bot.hears('p2p', async (ctx) => {
    await addToSubList(ctx)
})

export async function sendToSubs(msg) {
    if (msg) {
        //Отправляем сообщения каждому сабу
        for await (const iter of subscribers) {
            await bot.telegram.sendMessage(iter, msg)
        }

        return
    }

    console.log('Message text is empty.')
}

async function addToSubList(ctx) {
    let chat_id = (await ctx.getChat()).id

    //in - не работает
    for (const iter of subscribers) {
        if (chat_id == iter) {
            ctx.reply('You are already subscribed.')
            return
        }
    }

    subscribers.push(chat_id)

    writeFile(
        './src/subscribers.json',
        JSON.stringify(subscribers, '', 2),
        null,
        () => {}
    )

    ctx.reply('You added to sub list!\nPlease wait for a new Trade Situations.')
    console.log(`Added new sub: ${subscribers}`)
}

//bot.telegram.sendMessage(359375137, 'helllllllppp')
