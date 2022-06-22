import axios from 'axios'
import chalk from 'chalk'

setTimeout(() => {}, 300000)
const url = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search'

let res = await axios
    .post(url, {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.72 Safari/537.36',
            Connection: 'keep-alive',
        },
        body: JSON.stringify({
            page: 1,
            rows: 10,
            payTypes: ['Tinkoff'],
            countries: [],
            publisherType: null,
            fiat: 'RUB',
            tradeType: 'BUY',
            asset: 'USDT',
            merchantCheck: false,
        }),
    })
    .catch(async (err) => {
        console.log(Object.keys(err))
    })

console.log(chalk.bgRed(res))
