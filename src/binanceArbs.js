/**
 * Логика работы бота описывается здесь
 */

import * as puppeteer from './puppeteer.js'
import { readFileSync } from 'fs'
import chalk from 'chalk'
import { sendToSubs } from './telegram.js'

process.on('uncaughtException', (err, origin) => {
    console.log(err, origin)
    process.exit(0)
})

// Config init
global.conf = JSON.parse(readFileSync('./src/config.json'))

if (conf.check_period < 100) {
    conf.check_period = 100
}

conf.check_period = conf.check_period * 1000

// Variables to store
let pricesOfAllTradingPairs

// Main  -  тут основная логика бота
//initial call
console.log(chalk.blue(new Date().toLocaleString()))
await main()

setInterval(async () => {
    console.log(chalk.blue(getTime(), '\nMain interval started'))

    await main()
}, conf.check_period)

// Test  -  тест отдельных функций

// Functions

// Проверяем удовлетворяет ли настройкам профита
function checkConditions(profits) {
    for (const key in profits) {
        if (parseFloat(profits[key]) > conf.expectedProfit) {
            return profits
        }
    }
    return
}

function addDefaultCureenciesText(msg) {
    msg =
        msg +
        `\nUsd/Rub: ${pricesOfAllTradingPairs.usdRub}
Btc/Usd: ${pricesOfAllTradingPairs.btcUsd}
Usdt/Usd p2p: ${pricesOfAllTradingPairs.usdtUsd_bestOffer.price}
Usdt/Rub p2p:${pricesOfAllTradingPairs.usdtRub_bestOffer.price}
Btc/Rub p2p: ${pricesOfAllTradingPairs.btcRub_bestOffer.price}
Btc/Usd p2p: ${pricesOfAllTradingPairs.btcUsd_bestOffer.price}
        \nUsdtRub p2p дороже рынка на ${(
            pricesOfAllTradingPairs.usdtRub_bestOffer.price /
            pricesOfAllTradingPairs.usdRub
        ).toFixed(2)}
UsdtUsd p2p дороже рынка на ${pricesOfAllTradingPairs.usdtUsd_bestOffer.price}
BtcRub p2p дороже рынка на ${(
            pricesOfAllTradingPairs.btcRub_bestOffer.price /
            (pricesOfAllTradingPairs.btcUsd * pricesOfAllTradingPairs.usdRub)
        ).toFixed(2)}
BtcUsd p2p дороже рынка на ${(
            pricesOfAllTradingPairs.btcUsd_bestOffer.price /
            pricesOfAllTradingPairs.btcUsd
        ).toFixed(2)}`

    return msg
}

async function main() {
    // Получаем объект с офферами
    console.log('Loading prices of all trading pairs')
    pricesOfAllTradingPairs = await puppeteer.getPricesOfAllTradingPairs()
    //console.log('pricesIfSllTrading Pairs', pricesOfAllTradingPairs)

    // Рассичтываем возможные трейды
    let tradesProfit = calcTradesProfit(pricesOfAllTradingPairs)
    console.log('TradesProfit', tradesProfit)

    // Проверяем хороший ли профит от сделок
    tradesProfit = checkConditions(tradesProfit)

    if (tradesProfit) {
        // Создаем первоначальное сообщение
        let availibleTrades_message = createTradesMessage(tradesProfit)

        // Добавляем к сообщению что угодно
        let message_toSend = addDefaultCureenciesText(availibleTrades_message)

        console.log('Message to send:', `\n${message_toSend}`)

        sendToSubs(message_toSend)
    }

    //Просто выведем в консоль сообщение для отправки
    try {
        let availibleTrades_message = createTradesMessage(tradesProfit)

        // Добавляем к сообщению что угодно
        let message_toSend = addDefaultCureenciesText(availibleTrades_message)

        console.log('Message to send:', `\n${message_toSend}`)
    } catch (error) {}

    //
    console.log('main() ended')
}

// Вернет
function createTradesMessage(tradesProfit) {
    let messages = []

    if (tradesProfit) {
        messages.push('This trades are availible now:\n')
    }

    for (const key in tradesProfit) {
        messages.push(`${key} profit: ${tradesProfit[key]}%\n`)
    }

    let msg = ''
    for (const iter of messages) {
        msg = msg + iter
    }

    return msg
}

// Вернет объект с расчетом профитов от сделок
function calcTradesProfit(prices) {
    const startValue = 10000

    if (!prices.usdtRub_bestOffer || !prices.usdtRub_bestOffer.price) {
        console.log('usdtRub best Offer is undefined(((')
        //console.log(prices)
        process.exit(0)
    }

    // RUB > USDT > USD > RUB
    let rub_usdt_usd_rub = calcProfit(
        startValue,
        (startValue / prices.usdtRub_bestOffer.price) *
            prices.usdtUsd_bestOffer.price *
            prices.usdRub
    )

    // USD > USDT > RUB > USD
    let usd_usdt_rub_usd = calcProfit(
        startValue,
        ((startValue / prices.usdtUsd_bestOffer.price) *
            prices.usdtRub_bestOffer.price) /
            prices.usdRub
    )

    let usdt_rub_usd_usdt = calcProfit(
        startValue,
        (((startValue * prices.usdtRub_bestOffer.price) / prices.usdRub) *
            0.88) /
            prices.usdtUsd_bestOffer.price
    )

    // RUB > BTC > USD > RUB
    let rub_btc_usd_rub = calcProfit(
        startValue,
        (startValue / pricesOfAllTradingPairs.btcRub_bestOffer.price) *
            pricesOfAllTradingPairs.btcUsd_bestOffer.price *
            pricesOfAllTradingPairs.usdRub
    )

    // RUB > BTC > USDT > USD > RUB
    let rub_btc_usdt_usd_rub = calcProfit(
        startValue,
        (startValue / pricesOfAllTradingPairs.btcRub_bestOffer.price) *
            pricesOfAllTradingPairs.btcUsd *
            pricesOfAllTradingPairs.usdtUsd_bestOffer.price *
            pricesOfAllTradingPairs.usdRub
    )

    // RUB > BTC > USDT > RUB
    let rub_btc_usdt_rub = calcProfit(
        startValue,
        (startValue / pricesOfAllTradingPairs.btcRub_bestOffer.price) *
            pricesOfAllTradingPairs.btcUsd *
            pricesOfAllTradingPairs.usdtRub_bestOffer.price
    )

    return {
        rub_usdt_usd_rub: rub_usdt_usd_rub,
        usd_usdt_rub_usd: usd_usdt_rub_usd,
        usdt_rub_usd_usdt: usdt_rub_usd_usdt,
        rub_btc_usd_rub: rub_btc_usd_rub,
        rub_btc_usdt_usd_rub: rub_btc_usdt_usd_rub,
        rub_btc_usdt_rub: rub_btc_usdt_rub,
    }
}

function calcProfit(start, end) {
    return ((end / start) * 100 - 100).toFixed(2)
}

global.getTime = function () {
    return new Date().toLocaleString()
}
