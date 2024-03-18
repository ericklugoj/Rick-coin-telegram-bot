import fetch from 'node-fetch';

export async function getRickCoin() {
  const response = await fetch(
    'https://api.dexscreener.com/latest/dex/pairs/bsc/0xa2bd7c1b03a5de5f96e6152d62ed94d8c14d96f9'
  );
  const { pair } = await response.json();

  return transformData(pair);
}

function transformData(pair) {
  const rickCoin = {
    name: pair.baseToken.name,
    symbol: pair.baseToken.symbol,
    currentPrice: pair.priceUsd,
    liquidity: pair.liquidity.usd,
    FullyDilutedValue: pair.fdv,
    lastHour: {
      buys: pair.txns.h1.buys,
      sells: pair.txns.h1.sells,
      volume: pair.volume.h1,
      priceChange: pair.priceChange.h1,
    },
  };

  return rickCoin;
}
