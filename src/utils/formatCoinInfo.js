export function formatCoinInfo(coin) {
  const dollarUSLocale = Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'usd',
    maximumFractionDigits: 6,
    minimumFractionDigits: 2,
  });

  const coinInfo = `<b>🎃 RICKCOIN INFO 🎃
  
A continuación podrás ver la data en tiempo real de $RICK:

🧪 Precio actual: 
${dollarUSLocale.format(coin.currentPrice)} USD
  
🧪 Volumen 24H: 
${dollarUSLocale.format(coin.transactions.volume)} USD

🧪 Market Cap: 
${dollarUSLocale.format(coin.marketCap)} USD
  
<a href="https://dexscreener.com/bsc/0xA2bD7C1b03a5DE5F96e6152D62eD94d8c14D96f9">📊 Pulsa aquí para ver mas! 📊</a>
</b>`;

  return coinInfo;
}
