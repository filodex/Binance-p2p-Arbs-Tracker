/**
 * Логика работы бота описывается здесь
 */

import * as puppeteer from './puppeteer.js'
import { readFileSync } from 'fs'
import { sendToSubs } from './telegram.js'

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
await main()

setInterval(async () => {
  console.log(getTime(), '\nMain interval started')

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

    return
  }
}

function addDefaultCureenciesText(msg) {
  msg =
    msg +
    `\nUsd/Rub: ${pricesOfAllTradingPairs.usdRub}\nUsdt/Usd p2p: ${pricesOfAllTradingPairs.usdtUsd_bestOffer.price}\nUsdt/Rub: p2p${pricesOfAllTradingPairs.usdtRub_bestOffer.price}`
  return msg
}

async function main() {
  // Получаем объект с офферами
  console.log('Loading prices of all trading pairs')
  pricesOfAllTradingPairs = await puppeteer.getPricesOfAllTradingPairs()

  //
  let tradesProfit = getTradesProfit(pricesOfAllTradingPairs)
  console.log('TradesProfit', tradesProfit)

  tradesProfit = checkConditions(tradesProfit)

  if (tradesProfit) {
    // Создаем первоначальное сообщение
    let availibleTrades_message = createTradesMessage(tradesProfit)

    // Добавляем к сообщению что угодно
    let message_toSend = addDefaultCureenciesText(availibleTrades_message)

    console.log('Message to send:', `\n${message_toSend}`)

    sendToSubs(message_toSend)
  }

  //

  // Массив с хорошими трейдами отправляем в телегу
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
function getTradesProfit(prices) {
  const startValue = 10000

  // RUB > USDT > USD > RUB
  let rub_usdt_usd_rub = calcProfit(
    startValue,
    (startValue / prices.usdtRub_bestOffer.price) *
      prices.usdtUsd_bestOffer.price *
      prices.usdRub
  )

  let rub_usdt

  // USD > USDT > RUB > USD
  let usd_usdt_rub_usd = calcProfit(
    startValue,
    ((startValue / prices.usdtUsd_bestOffer.price) *
      prices.usdtRub_bestOffer.price) /
      prices.usdRub
  )

  let usdt_usd_rub_usdt = calcProfit(
    startValue,
    (startValue * prices.usdtUsd_bestOffer.price * prices.usdRub) /
      prices.usdtRub_bestOffer.price
  )

  let usdt_rub_usd_usdt = calcProfit(
    startValue,
    (((startValue * prices.usdtRub_bestOffer.price) / prices.usdRub) * 0.88) /
      prices.usdtUsd_bestOffer.price
  )

  return {
    rub_usdt_usd_rub: rub_usdt_usd_rub,
    usd_usdt_rub_usd: usd_usdt_rub_usd,
    usdt_rub_usd_usdt: usdt_rub_usd_usdt,
  }
}

function calcProfit(start, end) {
  return ((end / start) * 100 - 100).toFixed(2)
}

global.getTime = function () {
  return new Date().toLocaleString()
}