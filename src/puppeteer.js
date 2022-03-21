import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({ headless: true })
console.log('Browser launched')

// Максимально быстро получить все торгуемые пары
// USD-RUB; USDT-RUB #Tinkoff; USDT-USD #Tinkoff
export async function getPricesOfAllTradingPairs() {
  // Одна страница для всех запросов
  const page = await browser.newPage()

  // USD-RUB вернет значение вида 120.45 (Number) //DONE
  let usdRub = await getUsdRub(page)

  // USDT-RUB вернет все Тинькоф офферы в виде массива //DONE
  let usdtRubOffers = await getUsdtRubOffers_Tinkoff(page)

  // USDT-USD Tinkoff //DONE
  let usdtUsdOffers = await getUsdtUsd(page)

  // BTC-RUB Tinkoff
  //TO-DO

  page.close()

  // Возвращаем объект с офферами
  return {
    usdRub: usdRub,
    usdtRubOffers: usdtRubOffers,
    usdtRub_bestOffer: usdtRubOffers[0],
    usdtUsdOffers: usdtUsdOffers,
    usdtUsd_bestOffer: usdtUsdOffers[0],
  }
}

// Functions

// Вернет массив объектов офферов с именем ценой и доступным для покупки кол-вом
async function getUsdtUsd(page) {
  page.goto('https://p2p.binance.com/en?fiat=USD&payment=ALL')

  let offersBlockSelector =
    '#__APP > div.layout__Container-sc-1v4mjny-0.hFTMle.scroll-container > main > div.css-16g55fu > div > div.css-vurnku'

  await clickTinkoff(page)

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
async function getUsdtRubOffers_Tinkoff(page) {
  page.goto('https://p2p.binance.com/en?fiat=RUB&payment=ALL')
  let tinkoffSelector = '#Tinkoff'
  let offersBlockSelector =
    '#__APP > div.layout__Container-sc-1v4mjny-0.hFTMle.scroll-container > main > div.css-16g55fu > div > div.css-vurnku'

  // Ждем, когда загрузится кнопка банка и жмем
  await clickTinkoff(page)

  // Ждем, когда загрузится блок офферов
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
    return document.querySelector(currencySelector).innerText
  }, currencySelector)

  // Преобразуем usdRub из вида 120,4567 в 120.45
  usdRub = parseFloat(usdRub.replaceAll(',', '.')).toFixed(2)

  return parseFloat(usdRub)
}

// Функция запускается в pupppeteer браузере, в консоли и может быть передана в evaluate
function getOffers_evaluate() {
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
}

async function clickTinkoff(page) {
  let tinkoffSelector = '#Tinkoff'
  let offersBlockSelector =
    '#__APP > div.layout__Container-sc-1v4mjny-0.hFTMle.scroll-container > main > div.css-16g55fu > div > div.css-vurnku'

  // Ждем, когда загрузится кнопка банка и жмем
  await page.waitForSelector(offersBlockSelector) // Нужно ждать, т.к. ломается страница и не загружает офферы
  await page.waitForSelector(tinkoffSelector)
  await page.evaluate(() => {
    document.querySelector('#Tinkoff').click()
  })
}

async function clickShowMerchants(page) {
  await page.evaluate(() => {
    document
      .querySelector(
        '#__APP > div.layout__Container-sc-1v4mjny-0.hFTMle.scroll-container > main > div.css-r4oxcz > div > div.css-n901vs > div.css-1gil9zk > label'
      )
      .click()
  })
}
