export function formatCoinInfo(coin) {
  const dollarUSLocale = Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'usd',
    maximumFractionDigits: 6,
    minimumFractionDigits: 2,
  });

  const coinInfo = `
<b>$RICKCOIN PRICE INFO 🔥📊</b>

<b>Precio actual:</b> ${dollarUSLocale.format(coin.currentPrice)} USD

<b>Capitalizacion:</b> ${dollarUSLocale.format(coin.FullyDilutedValue)} USD

<b>Volumen 1H:</b> ${dollarUSLocale.format(coin.lastHour.volume)} USD
  
<a href="https://dexscreener.com/bsc/0xA2bD7C1b03a5DE5F96e6152D62eD94d8c14D96f9">Ir a la grafica</a>
  `;

  return coinInfo;
}
