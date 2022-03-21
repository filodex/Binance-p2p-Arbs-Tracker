**Arbs Tracker**
---
<h3>Introduction</h3>
This is a simple telegram bot, that checks Binance p2p exchange for a different arbitrage situations. 
If there is a good chance to take a profit, bot will notify you in Telegram.

<h3>Installation</h3>

```
npm install
node src/binanceArbs.js
```

<h3>Settings</h3>
At first, append your bot token to src/token.txt

You can change settings in src/config.json

check_period - is a period to check new offers in Binance p2p (in seconds)

expectedProfit - the bot will notify you if expectedProfit is above this value (in %)
