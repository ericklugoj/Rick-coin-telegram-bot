export function formatCoinInfo(coin) {
  const dollarUSLocale = Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'usd',
    maximumFractionDigits: 6,
    minimumFractionDigits: 2,
  });

  const coinInfo = `
<b>RICK COIN INFO 🚀</b>

<b>Precio actual:</b> ${dollarUSLocale.format(coin.currentPrice)} USD
<b>Liquidez:</b> ${dollarUSLocale.format(coin.liquidity)} USD
<b>Capitalizacion (FDV):</b> ${dollarUSLocale.format(
    coin.FullyDilutedValue
  )} USD

<b>Transacciones en la ultima hora:</b>

<b>Compras:</b> ${coin.lastHour.buys}
<b>Ventas:</b> ${coin.lastHour.sells}
<b>Volumen:</b> ${dollarUSLocale.format(coin.lastHour.volume)} USD
<b>El precio cambió:</b> ${coin.lastHour.priceChange}%
  `;

  return coinInfo;
}
