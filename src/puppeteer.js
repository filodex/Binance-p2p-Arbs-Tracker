import puppeteer from 'puppeteer'
import { readFileSync } from 'fs'

let config = JSON.parse(readFileSync('./src/config.json'))

const browser = await puppeteer.launch({ headless: config.headless })
console.log('Browser launched')

// Максимально быстро получить все торгуемые пары
// USD-RUB; USDT-RUB #Tinkoff; USDT-USD #Tinkoff
export async function getPricesOfAllTradingPairs() {
    try {
        // Одна страница для всех запросов
        const page = await browser.newPage()
        page.setDefaultNavigationTimeout(60000)

        // USD-RUB вернет значение вида 120.45 (Number) //DONE
        let usdRub = await getUsdRub(page)

        //BTC-USD exchange
        let btcUsd = await getBtcUsd(page)

        // USDT-RUB вернет все Тинькоф офферы в виде массива //DONE
        let usdtRubOffers = await getUsdtRubOffers(page)

        // USDT-USD Tinkoff //DONE
        let usdtUsdOffers = await getUsdtUsdOffers(page)

        // BTC-RUB Tinkoff
        let btcRubOffers = await getBtcRubOffers(page)

        // Btc-usd Tinkoff
        let btcUsdOffers = await getBtcUsdOffers(page)

        //TO-DO

        page.close()

        return {
            usdRub: usdRub,
            btcUsd: btcUsd,
            usdtRubOffers: usdtRubOffers,
            usdtRub_bestOffer: usdtRubOffers[0],
            usdtUsdOffers: usdtUsdOffers,
            usdtUsd_bestOffer: usdtUsdOffers[0],
            btcRubOffers: btcRubOffers,
            btcRub_bestOffer: btcRubOffers[0],
            btcUsdOffers: btcUsdOffers,
            btcUsd_bestOffer: btcUsdOffers[0],
        }
    } catch (error) {
        console.log(error)
    }

    // Возвращаем объект с офферами
}

// Functions
async function getBtcUsd(page) {
    page.goto('https://ru.investing.com/crypto/bitcoin/btc-usd')

    let currencySelector =
        '#__next > div.desktop\\:relative.desktop\\:bg-background-default > div > div > div.grid.gap-4.tablet\\:gap-6.grid-cols-4.tablet\\:grid-cols-8.desktop\\:grid-cols-12.grid-container--fixed-desktop.general-layout_main__3tg3t > main > div > div.instrument-header_instrument-header__1SRl8.mb-5.bg-background-surface.tablet\\:grid.tablet\\:grid-cols-2 > div:nth-child(2) > div.instrument-price_instrument-price__3uw25.flex.items-end.flex-wrap.font-bold > span'

    await page.waitForSelector(currencySelector)

    let btcUsd = await page.evaluate((currencySelector) => {
        try {
            return document.querySelector(currencySelector).innerText
        } catch (error) {}
    }, currencySelector)

    // Преобразуем usdRub из вида 120,4567 в 120.45
    btcUsd = parseFloat(
        btcUsd.replaceAll('.', '').replaceAll(',', '.')
    ).toFixed(2)

    return parseFloat(btcUsd)
}

async function getBtcUsdOffers(page) {
    page.goto('https://p2p.binance.com/en/trade/Tinkoff/BTC?fiat=USD')
    let offersBlockSelector =
        '#__APP > div.layout__Container-sc-1v4mjny-0.hFTMle.scroll-container > main > div.css-186r813 > div > div.css-vurnku'

    await page.waitForSelector(offersBlockSelector)

    await clickShowMerchants(page)

    // Ждем, когда загрузится блок офферов
    await page.waitForSelector(offersBlockSelector)
    await page.waitForSelector(offersBlockSelector)

    // Создаем массив с офферами
    let btcUsdOffers = await page.evaluate(getOffers_evaluate)

    return btcUsdOffers
}

async function getBtcRubOffers(page) {
    page.goto('https://p2p.binance.com/en/trade/Tinkoff/BTC?fiat=RUB')
    let tinkoffSelector = '#Tinkoff'
    let offersBlockSelector =
        '#__APP > div.layout__Container-sc-1v4mjny-0.hFTMle.scroll-container > main > div.css-186r813 > div > div.css-vurnku'

    // Ждем, когда загрузится кнопка банка и жмем
    //   await clickTinkoff(page)

    // Ждем, когда загрузится блок офферов
    await page.waitForSelector(offersBlockSelector)
    await page.waitForSelector(offersBlockSelector)

    // Создаем массив с офферами
    let usdtRubOffers = await page.evaluate(getOffers_evaluate)

    return usdtRubOffers
}

async function getUsdRub(page) {
    page.goto('https://ru.investing.com/currencies/usd-rub')

    let currencySelector =
        '#__next > div.desktop\\:relative.desktop\\:bg-background-default > div > div > div.grid.gap-4.tablet\\:gap-6.grid-cols-4.tablet\\:grid-cols-8.desktop\\:grid-cols-12.grid-container--fixed-desktop.general-layout_main__3tg3t > main > div > div.instrument-header_instrument-header__1SRl8.mb-5.bg-background-surface.tablet\\:grid.tablet\\:grid-cols-2 > div:nth-child(2) > div.instrument-price_instrument-price__3uw25.flex.items-end.flex-wrap.font-bold > span'

    await page.waitForSelector(currencySelector)

    let usdRub = await page.evaluate((currencySelector) => {
        try {
            return document.querySelector(currencySelector).innerText
        } catch (error) {}
    }, currencySelector)

    // Преобразуем usdRub из вида 120,4567 в 120.45
    usdRub = parseFloat(usdRub.replaceAll(',', '.')).toFixed(2)

    return parseFloat(usdRub)
}

// Вернет массив объектов офферов с именем ценой и доступным для покупки кол-вом
async function getUsdtUsdOffers(page) {
    page.goto('https://p2p.binance.com/en/trade/Tinkoff/USDT?fiat=USD')

    let offersBlockSelector =
        '#__APP > div.layout__Container-sc-1v4mjny-0.hFTMle.scroll-container > main > div.css-186r813 > div > div.css-vurnku'

    // Ждем, когда загрузится блок офферов
    await page.waitForSelector(offersBlockSelector)

    // Убираем галочку с показывать только мерчантов
    await clickShowMerchants(page)

    // Ждем, когда загрузится блок офферов
    await page.waitForSelector(offersBlockSelector)

    // Создаем массив с офферами
    let usdtUsdOffers = await page.evaluate(getOffers_evaluate)

    return usdtUsdOffers
}

// Вернет массив объектов офферов с именем ценой и доступным для покупки кол-вом // DONE
async function getUsdtRubOffers(page) {
    page.goto('https://p2p.binance.com/en/trade/Tinkoff/USDT?fiat=RUB')
    let tinkoffSelector = '#Tinkoff'
    let offersBlockSelector =
        '#__APP > div.layout__Container-sc-1v4mjny-0.hFTMle.scroll-container > main > div.css-186r813 > div > div.css-vurnku'
    // Ждем, когда загрузится кнопка банка и жме
    //    await clickTinkoff(page)

    // Ждем, когда загрузится блок офферов
    await page.waitForSelector(offersBlockSelector)
    await page.waitForSelector(offersBlockSelector)

    // Создаем массив с офферами
    let usdtRubOffers = await page.evaluate(getOffers_evaluate)

    return usdtRubOffers
}

// Функция запускается в pupppeteer браузере, в консоли и может быть передана в evaluate
function getOffers_evaluate() {
    try {
        // Получаем массив 10 офферов
        let offers_arr = document.querySelectorAll('.css-1q1sp11')

        // Перебираем каждый оффер и создаем объект оффера
        let offers = []
        for (const iter of offers_arr) {
            // объект с именем ценой и доступным кол-вом
            let offer = {}

            let offerText = iter.innerText // 'D\nDaniilMalandii\n78 ордеров\n97.50% выполнено\n119.69\nRUB\nДоступно\n631.08 USDT\nЛимит\n₽\n1,000.00\n-\n₽\n75,535.03\nКупить USDT'
            offerText = offerText.split('\n') // Массив из ['D', 'DaniilMalandii', '78 ордеров'...]

            offer.name = offerText[1] // 'DaniilMalandii'
            offer.price = parseFloat(offerText[4].replaceAll(',', '')) // Аккуратно, могут быть запятые в больших числах
            offer.availibleAmount = parseFloat(offerText[7].replaceAll(',', ''))

            offers.push(offer)
        }

        return offers
    } catch (error) {}
}

// WRONG SELECTOR
async function clickTinkoff(page) {
    let tinkoffSelector = '#Tinkoff'
    let offersBlockSelector =
        '#__APP > div.layout__Container-sc-1v4mjny-0.hFTMle.scroll-container > main > div.css-16g55fu > div > div.css-vurnku'

    // Ждем, когда загрузится кнопка банка и жмем
    await page.waitForSelector(offersBlockSelector) // Нужно ждать, т.к. ломается страница и не загружает офферы
    await page.waitForSelector(tinkoffSelector)
    await page.evaluate(() => {
        try {
            document.querySelector('#Tinkoff').click()
        } catch (error) {}
    })
}

async function clickShowMerchants(page) {
    await page.evaluate(() => {
        try {
            document
                .querySelector(
                    '#__APP > div.layout__Container-sc-1v4mjny-0.hFTMle.scroll-container > main > div.css-1qaka1k > div > div.css-1pguc4d > div.css-1gil9zk > label'
                )
                .click()
        } catch (error) {
            console.log(error)
        }
    })
}
