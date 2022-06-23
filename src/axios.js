import axios from 'axios'
import chalk from 'chalk'

setTimeout(() => {}, 300000)

const url = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search'

const rawData_text =
    '{"page":1,"rows":10,"payTypes":["Tinkoff"],"countries":[],"publisherType":null,"asset":"USDT","fiat":"RUB","tradeType":"BUY"}'
const rawData_object = {
    page: 1,
    rows: 10,
    payTypes: ['Tinkoff'],
    countries: [],
    publisherType: null,
    asset: 'USDT',
    fiat: 'RUB',
    tradeType: 'BUY',
}
const rawData_stringified = JSON.stringify(rawData_object)

async function sendRequest() {
    let response = await axios.post(url, rawData_object) // --РАБОТАЕТ--
}

let response = await sendRequest()
console.log(response.data)
